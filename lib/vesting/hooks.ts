import { useCallback, useEffect, useState } from 'react'
import { 
  usePublicClient, 
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt 
} from 'wagmi'
import { type Address, parseAbiItem } from 'viem'
import { toast } from 'sonner'
import hyperVestingABI from '@/constants/hyperVestingABI.json'
import erc20ABI from '@/constants/erc20ABI.json'
import type { Stream, ClaimHistoryItem } from './types'
import { 
  ensureChecksumAddress, 
  estimateBlockForDate,
  monthsToReleaseRate,
  percentageToBasisPoints,
  cliffMonthsToSeconds,
  periodDaysToSeconds,
  parseAmountToWei
} from './utils'
import { VESTING_CONSTANTS } from './constants'

/**
 * Hook to fetch vesting streams for a user
 */
export function useVestingStreams(contractAddress: string, userAddress?: Address) {
  const publicClient = usePublicClient()
  const [streams, setStreams] = useState<Stream[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { data: streamIds, refetch: refetchStreamIds } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'getUserStreamIds',
    args: userAddress ? [userAddress] : undefined,
  })
  
  const fetchStreams = useCallback(async () => {
    if (!streamIds || !userAddress || !publicClient) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const streamPromises = (streamIds as bigint[]).map(async (streamId) => {
        try {
          const info = await publicClient.readContract({
            address: contractAddress as Address,
            abi: hyperVestingABI,
            functionName: 'getStreamInfo',
            args: [userAddress, streamId],
          }) as {
            totalAmount: bigint
            totalClaimed: bigint
            startTime: bigint
            cliff: bigint
            releaseRate: number
            tgeRate: number
            period: number
            active: boolean
            claimable: bigint
          }
          
          return {
            streamId: Number(streamId),
            totalAmount: info.totalAmount as bigint,
            totalClaimed: info.totalClaimed as bigint,
            startTime: info.startTime as bigint,
            cliff: info.cliff as bigint,
            releaseRate: Number(info.releaseRate),
            tgeRate: Number(info.tgeRate),
            period: Number(info.period),
            active: info.active as boolean,
            claimable: info.claimable as bigint,
          }
        } catch (error) {
          console.error(`Error fetching stream ${streamId}:`, error)
          return null
        }
      })
      
      const streamDetails = await Promise.all(streamPromises)
      const validStreams = streamDetails.filter((stream): stream is Stream => stream !== null)
      
      setStreams(validStreams)
    } catch (err) {
      setError((err as Error).message)
      console.error('Error fetching streams:', err)
    } finally {
      setIsLoading(false)
    }
  }, [streamIds, userAddress, publicClient, contractAddress])
  
  useEffect(() => {
    fetchStreams()
  }, [fetchStreams])
  
  return { streams, isLoading, error, refetch: refetchStreamIds }
}

/**
 * Hook to handle token approval
 */
export function useTokenApproval(
  tokenAddress: Address | undefined,
  spenderAddress: Address,
  owner: Address | undefined
) {
  const { 
    writeContract: approve,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError
  } = useWriteContract()
  
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = 
    useWaitForTransactionReceipt({ hash: approveHash })
  
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: 'allowance',
    args: owner && spenderAddress ? [owner, spenderAddress] : undefined,
  })
  
  const approveToken = useCallback(async (amount: bigint) => {
    if (!tokenAddress) {
      toast.error('Token address not found')
      return
    }
    
    try {
      const checksummedToken = ensureChecksumAddress(tokenAddress)
      const checksummedSpender = ensureChecksumAddress(spenderAddress)
      
      console.log('Approving token:', {
        token: checksummedToken,
        spender: checksummedSpender,
        amount: amount.toString()
      })
      
      await approve({
        address: checksummedToken,
        abi: erc20ABI,
        functionName: 'approve',
        args: [checksummedSpender, amount],
      })
      
      toast.info('Approval transaction submitted')
    } catch (error) {
      console.error('Approval error:', error)
      toast.error(`Approval failed: ${(error as Error).message}`)
    }
  }, [tokenAddress, spenderAddress, approve])
  
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('Token approval successful!')
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])
  
  useEffect(() => {
    if (approveError) {
      console.error('Approval error:', approveError)
      toast.error(`Approval failed: ${approveError.message}`)
    }
  }, [approveError])
  
  return {
    approveToken,
    allowance: allowance as bigint | undefined,
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    refetchAllowance
  }
}

/**
 * Hook to fetch claim history
 */
export function useClaimHistory(
  contractAddress: string,
  userAddress?: Address
) {
  const publicClient = usePublicClient()
  const [history, setHistory] = useState<ClaimHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchHistory = useCallback(async () => {
    if (!userAddress || !publicClient) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Estimate block for August 1, 2025
      const targetBlock = await estimateBlockForDate(
        publicClient,
        VESTING_CONSTANTS.CLAIM_HISTORY_START_DATE
      )
      
      const logs = await publicClient.getLogs({
        address: contractAddress as Address,
        event: parseAbiItem('event Claimed(address indexed user, uint256 indexed streamId, uint256 timestamp, uint256 claimedAmount, uint256 totalClaimed, uint256 totalAmount)'),
        args: {
          user: userAddress,
        },
        fromBlock: targetBlock,
        toBlock: 'latest',
      })
      
      const historyItems = logs.map(log => {
        const args = log.args as {
          timestamp?: bigint
          streamId?: bigint
          claimedAmount?: bigint
          totalClaimed?: bigint
          totalAmount?: bigint
        }
        return {
          transactionHash: log.transactionHash,
          timestamp: Number(args.timestamp || 0),
          streamId: Number(args.streamId || 0),
          claimedAmount: args.claimedAmount?.toString() || '0',
          totalClaimed: args.totalClaimed?.toString() || '0',
          totalAmount: args.totalAmount?.toString() || '0',
          blockNumber: log.blockNumber,
        }
      }).reverse()
      
      setHistory(historyItems)
    } catch (err) {
      setError((err as Error).message)
      console.error('Error fetching claim history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userAddress, publicClient, contractAddress])
  
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])
  
  return { history, isLoading, error, refetch: fetchHistory }
}

/**
 * Hook for stream search functionality
 */
export function useStreamSearch(contractAddress: string) {
  const publicClient = usePublicClient()
  const [searchResults, setSearchResults] = useState<Stream[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const searchUserStreams = useCallback(async (userAddress: string) => {
    if (!publicClient) {
      toast.error('Web3 client not available')
      return
    }
    
    setIsSearching(true)
    
    try {
      const checksumAddress = ensureChecksumAddress(userAddress)
      
      // Get stream IDs for the user
      const userStreamIds = await publicClient.readContract({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'getUserStreamIds',
        args: [checksumAddress],
      }) as bigint[]
      
      if (!userStreamIds || userStreamIds.length === 0) {
        toast.info('No streams found for this address')
        setSearchResults([])
        return
      }
      
      // Fetch stream details with error handling
      const streamDetails = await Promise.all(
        userStreamIds.map(async (streamId) => {
          try {
            const info = await publicClient.readContract({
              address: contractAddress as Address,
              abi: hyperVestingABI,
              functionName: 'getStreamInfo',
              args: [checksumAddress, streamId],
            }) as {
            totalAmount: bigint
            totalClaimed: bigint
            startTime: bigint
            cliff: bigint
            releaseRate: number
            tgeRate: number
            period: number
            active: boolean
            claimable: bigint
          }
            
            return {
              streamId: Number(streamId),
              totalAmount: info.totalAmount as bigint,
              totalClaimed: info.totalClaimed as bigint,
              startTime: info.startTime as bigint,
              cliff: info.cliff as bigint,
              releaseRate: Number(info.releaseRate),
              tgeRate: Number(info.tgeRate),
              period: Number(info.period),
              active: info.active as boolean,
              claimable: info.claimable as bigint,
            }
          } catch (error) {
            console.error(`Error fetching stream ${streamId}:`, error)
            return null
          }
        })
      )
      
      const validStreams = streamDetails.filter((stream): stream is Stream => stream !== null)
      
      setSearchResults(validStreams)
      toast.success(`Found ${validStreams.length} stream(s) for this address`)
    } catch (error) {
      console.error('Stream search error:', error)
      toast.error(`Search failed: ${(error as Error).message}`)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [publicClient, contractAddress])
  
  return { searchResults, isSearching, searchUserStreams }
}

/**
 * Hook for creating streams with proper validation
 */
export function useCreateStream(
  contractAddress: string,
  tokenDecimals: number = 18
) {
  const { 
    writeContract: addStream,
    data: addStreamHash,
    isPending: isAddStreamPending
  } = useWriteContract()
  
  const { isLoading: isAddStreamConfirming, isSuccess: isAddStreamSuccess } = 
    useWaitForTransactionReceipt({ hash: addStreamHash })
  
  const createStream = useCallback(async (
    user: string,
    amount: string,
    cliffMonths: string,
    releaseMonths: string,
    tgePercentage: string,
    periodDays: string
  ) => {
    try {
      const checksumAddress = ensureChecksumAddress(user)
      const amountInWei = parseAmountToWei(amount, tokenDecimals)
      const cliffSeconds = cliffMonthsToSeconds(Number(cliffMonths))
      const releaseRate = monthsToReleaseRate(Number(releaseMonths))
      const tgeRate = percentageToBasisPoints(Number(tgePercentage))
      const periodSeconds = periodDaysToSeconds(Number(periodDays))
      
      console.log('Creating stream:', {
        user: checksumAddress,
        amount: amountInWei.toString(),
        cliff: cliffSeconds.toString(),
        releaseRate,
        tgeRate,
        period: periodSeconds
      })
      
      await addStream({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'addStream',
        args: [
          checksumAddress,
          amountInWei,
          cliffSeconds,
          releaseRate,
          tgeRate,
          periodSeconds,
        ],
      })
      
      toast.info('Stream creation transaction submitted')
    } catch (error) {
      console.error('Create stream error:', error)
      toast.error(`Failed to create stream: ${(error as Error).message}`)
    }
  }, [contractAddress, tokenDecimals, addStream])
  
  return {
    createStream,
    isAddStreamPending,
    isAddStreamConfirming,
    isAddStreamSuccess
  }
}