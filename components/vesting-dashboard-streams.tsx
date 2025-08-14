"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { formatUnits, parseUnits, type Address, parseAbiItem, getAddress } from 'viem'
import { arbitrum, bscTestnet } from 'viem/chains'
import hyperVestingABI from '@/constants/hyperVestingABI.json'
import erc20ABI from '@/constants/erc20ABI.json'
import { toast } from "sonner"
import { 
  Coins, 
  Wallet, 
  ExternalLink, 
  Copy,
  CheckCircle,
  Info,
  Timer,
  Unlock,
  AlertCircle,
  Loader2,
  Plus,
  PlayCircle,
  PauseCircle,
  Clock,
  Calendar,
  TrendingUp,
  Shield,
  Lock,
  ArrowRight,
  FileText,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CustomConnectButton } from "@/components/custom-connect-button"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VestingDashboardProps {
  contractAddress: string
}

interface Stream {
  streamId: number
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

interface ClaimHistoryItem {
  transactionHash: string
  timestamp: number
  streamId: number
  claimedAmount: string
  totalClaimed: string
  totalAmount: string
  blockNumber: bigint
}

export function VestingDashboardStreams({ contractAddress }: VestingDashboardProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  
  // State
  const [streams, setStreams] = React.useState<Stream[]>([])
  const [selectedStreamIds, setSelectedStreamIds] = React.useState<number[]>([])
  const [claimHistory, setClaimHistory] = React.useState<ClaimHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)
  const [copiedAddress, setCopiedAddress] = React.useState(false)
  
  // Admin state
  const [showCreateStream, setShowCreateStream] = React.useState(false)
  const [depositAmount, setDepositAmount] = React.useState('')
  
  // Stream creation state
  const [newStreamUser, setNewStreamUser] = React.useState('')
  const [newStreamAmount, setNewStreamAmount] = React.useState('')
  const [newStreamCliff, setNewStreamCliff] = React.useState('0')
  const [newStreamTgeRate, setNewStreamTgeRate] = React.useState('10')
  const [newStreamReleaseMonths, setNewStreamReleaseMonths] = React.useState('12')
  const [newStreamPeriod, setNewStreamPeriod] = React.useState('30')

  // Contract reads
  const { data: tokenAddress } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'tokenAddress',
  })

  const { data: tgeTimestamp } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'tgeTimestamp',
  })

  const { data: owner } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'owner',
  })

  const { data: totalLocked, refetch: refetchTotalLocked } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'totalLocked',
  })

  const { data: maxTokensToLock } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'maxTokensToLock',
  })

  const { data: nextStreamId } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'nextStreamId',
  })

  const { data: streamIds, refetch: refetchStreamIds } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'getUserStreamIds',
    args: address ? [address] : undefined,
  })

  const { refetch: refetchTotalClaimable } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'getTotalClaimable',
    args: address ? [address] : undefined,
  })

  const { data: activeStreamCount } = useReadContract({
    address: contractAddress as Address,
    abi: hyperVestingABI,
    functionName: 'getActiveStreamCount',
    args: address ? [address] : undefined,
  })

  // Token info
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: 'symbol',
  })

  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: 'decimals',
  })

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: contractAddress ? [contractAddress as Address] : undefined,
  })

  // Write functions
  const { 
    writeContract: claimStream,
    data: claimHash,
    isPending: isClaimPending
  } = useWriteContract()

  const { 
    writeContract: claimAll,
    data: claimAllHash,
    isPending: isClaimAllPending
  } = useWriteContract()

  const { 
    writeContract: claimBatch,
    isPending: isClaimBatchPending
  } = useWriteContract()

  const { 
    writeContract: addStream,
    data: addStreamHash,
    isPending: isAddStreamPending
  } = useWriteContract()


  // const { 
  //   writeContract: cancelStream,
  // } = useWriteContract()

  const { 
    writeContract: depositTokens,
    data: depositHash,
    isPending: isDepositPending
  } = useWriteContract()

  const { 
    writeContract: approveToken,
    data: approveHash,
    isPending: isApprovePending
  } = useWriteContract()

  // Transaction confirmations
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  const { isLoading: isClaimAllConfirming, isSuccess: isClaimAllSuccess } = useWaitForTransactionReceipt({
    hash: claimAllHash,
  })

  const { isLoading: isAddStreamConfirming, isSuccess: isAddStreamSuccess } = useWaitForTransactionReceipt({
    hash: addStreamHash,
  })

  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Check token allowance
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: 'allowance',
    args: address && contractAddress ? [address as Address, contractAddress as Address] : undefined,
  })

  // Fetch all stream details
  React.useEffect(() => {
    const fetchStreams = async () => {
      if (!streamIds || !address || !publicClient) return

      const streamDetails = await Promise.all(
        (streamIds as bigint[]).map(async (streamId) => {
          const info = await publicClient.readContract({
            address: contractAddress as Address,
            abi: hyperVestingABI,
            functionName: 'getStreamInfo',
            args: [address, streamId],
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

          // The contract now returns a struct (tuple)
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
        })
      )

      setStreams(streamDetails)
    }

    fetchStreams()
  }, [streamIds, address, publicClient, contractAddress])

  // Fetch claim history
  const fetchClaimHistory = React.useCallback(async () => {
    if (!address || !publicClient) return

    setIsLoadingHistory(true)
    try {
      const fromBlock = BigInt(1000000) // Adjust based on deployment block
      const toBlock = 'latest' as const

      const logs = await publicClient.getLogs({
        address: contractAddress as Address,
        event: parseAbiItem('event Claimed(address indexed user, uint256 indexed streamId, uint256 timestamp, uint256 claimedAmount, uint256 totalClaimed, uint256 totalAmount)'),
        args: {
          user: address,
        },
        fromBlock,
        toBlock,
      })

      const history = logs.map(log => {
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
          claimedAmount: formatUnits(args.claimedAmount || BigInt(0), (tokenDecimals as number) || 18),
          totalClaimed: formatUnits(args.totalClaimed || BigInt(0), (tokenDecimals as number) || 18),
          totalAmount: formatUnits(args.totalAmount || BigInt(0), (tokenDecimals as number) || 18),
          blockNumber: log.blockNumber,
        }
      }).reverse()

      setClaimHistory(history)
    } catch (error) {
      console.error('Error fetching claim history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [address, publicClient, contractAddress, tokenDecimals])

  React.useEffect(() => {
    if (address && publicClient) {
      fetchClaimHistory()
    }
  }, [address, publicClient, fetchClaimHistory])

  // Success handlers with real-time updates
  React.useEffect(() => {
    if (isClaimSuccess || isClaimAllSuccess) {
      toast.success('Tokens claimed successfully!')
      refetchStreamIds()
      refetchTotalClaimable()
      fetchClaimHistory()
      
      // Additional refetch after 2 seconds for real-time updates
      const timer = setTimeout(() => {
        refetchStreamIds() // This will trigger the streams useEffect to reload
        refetchTotalClaimable()
        fetchClaimHistory()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isClaimSuccess, isClaimAllSuccess, fetchClaimHistory, refetchStreamIds, refetchTotalClaimable])

  React.useEffect(() => {
    if (isAddStreamSuccess) {
      toast.success('Stream created successfully!')
      setShowCreateStream(false)
      refetchStreamIds()
      refetchTotalLocked()
      // Reset form
      setNewStreamUser('')
      setNewStreamAmount('')
      setNewStreamCliff('0')
      setNewStreamTgeRate('10')
      setNewStreamReleaseMonths('12')
      setNewStreamPeriod('30')
    }
  }, [isAddStreamSuccess, refetchStreamIds, refetchTotalLocked])

  React.useEffect(() => {
    if (isDepositSuccess) {
      toast.success('Tokens deposited successfully!')
      setDepositAmount('')
      refetchTokenBalance()
    }
  }, [isDepositSuccess, refetchTokenBalance])

  // Handle approval success - automatically deposit after approval
  React.useEffect(() => {
    if (isApproveSuccess && depositAmount) {
      toast.success('Approval successful! Now depositing tokens...')
      refetchAllowance()
      
      // Small delay to ensure allowance is updated
      setTimeout(() => {
        const amountInWei = parseUnits(depositAmount, (tokenDecimals as number) || 18)
        depositTokens({
          address: contractAddress as Address,
          abi: hyperVestingABI,
          functionName: 'depositTokens',
          args: [amountInWei],
        })
      }, 1000)
    }
  }, [isApproveSuccess, depositAmount, tokenDecimals, depositTokens, contractAddress, refetchAllowance])

  // Handlers
  const handleClaimStream = (streamId: number) => {
    try {
      claimStream({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'claim',
        args: [BigInt(streamId)],
      })
    } catch (error) {
      console.error('Claim error:', error)
      toast.error('Failed to claim: ' + (error as Error).message)
    }
  }

  const handleClaimAll = () => {
    try {
      claimAll({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'claimAll',
      })
    } catch (error) {
      console.error('Claim all error:', error)
      toast.error('Failed to claim all: ' + (error as Error).message)
    }
  }

  const handleClaimSelected = () => {
    if (selectedStreamIds.length === 0) {
      toast.error('Please select streams to claim')
      return
    }

    try {
      claimBatch({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'claimBatch',
        args: [selectedStreamIds.map(id => BigInt(id))],
      })
    } catch (error) {
      console.error('Claim batch error:', error)
      toast.error('Failed to claim batch: ' + (error as Error).message)
    }
  }

  const handleCreateStream = () => {
    if (!newStreamUser || !newStreamAmount) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const checksumAddress = getAddress(newStreamUser) as Address
      const amountInWei = parseUnits(newStreamAmount, (tokenDecimals as number) || 18)
      const cliffSeconds = BigInt(Number(newStreamCliff) * 30 * 24 * 60 * 60) // months to seconds
      const tgeRateBps = Number(newStreamTgeRate) * 100 // percentage to basis points
      const releaseRate = Math.floor(21600000000 / Number(newStreamReleaseMonths) * Number(newStreamPeriod) / 30)
      const periodSeconds = Number(newStreamPeriod) * 24 * 60 * 60 // days to seconds

      addStream({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'addStream',
        args: [
          checksumAddress,
          amountInWei,
          cliffSeconds,
          releaseRate,
          tgeRateBps,
          periodSeconds,
        ],
      })
    } catch (error) {
      console.error('Create stream error:', error)
      toast.error('Failed to create stream: ' + (error as Error).message)
    }
  }

  // const _handleCancelStream = (streamId: number) => {
  //   if (!confirm('Are you sure you want to cancel this stream? This action cannot be undone.')) {
  //     return
  //   }

  //   try {
  //     cancelStream({
  //       address: contractAddress as Address,
  //       abi: hyperVestingABI,
  //       functionName: 'cancelStream',
  //       args: [BigInt(streamId)],
  //     })
  //   } catch (error) {
  //     console.error('Cancel stream error:', error)
  //     toast.error('Failed to cancel stream: ' + (error as Error).message)
  //   }
  // }

  const handleDepositTokens = async () => {
    if (!depositAmount) {
      toast.error('Please enter an amount')
      return
    }

    try {
      const amountInWei = parseUnits(depositAmount, (tokenDecimals as number) || 18)
      
      // Check if we need approval
      const currentAllowance = (tokenAllowance as bigint) || BigInt(0)
      
      if (currentAllowance < amountInWei) {
        // Need approval first
        toast.info('Approval required. Please approve the transaction.')
        approveToken({
          address: tokenAddress as Address,
          abi: erc20ABI,
          functionName: 'approve',
          args: [contractAddress as Address, amountInWei],
        })
      } else {
        // Already approved, proceed with deposit
        depositTokens({
          address: contractAddress as Address,
          abi: hyperVestingABI,
          functionName: 'depositTokens',
          args: [amountInWei],
        })
      }
    } catch (error) {
      console.error('Deposit error:', error)
      toast.error('Failed to process: ' + (error as Error).message)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(contractAddress)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'PPP HH:mm')
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(true)
      toast.success('Address copied to clipboard!')
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch {
      toast.error('Failed to copy address')
    }
  }

  const getExplorerUrl = (type: 'address' | 'tx', hash: string) => {
    const explorers: Record<number, string> = {
      [arbitrum.id]: 'https://arbiscan.io',
      [bscTestnet.id]: 'https://testnet.bscscan.com',
      999: 'https://hyperevmscan.io', // HyperEVM
    }
    
    const baseUrl = explorers[chainId] || ''
    if (!baseUrl) return null
    
    return `${baseUrl}/${type}/${hash}`
  }

  const isOwner = Boolean(owner && address && (owner as string).toLowerCase() === address.toLowerCase())

  // Calculate total amounts across all streams
  const totalAllocation = streams.reduce((sum, stream) => sum + stream.totalAmount, BigInt(0))
  const totalClaimed = streams.reduce((sum, stream) => sum + stream.totalClaimed, BigInt(0))
  const totalClaimableNow = streams.reduce((sum, stream) => stream.active ? sum + stream.claimable : sum, BigInt(0))

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/20 via-transparent to-transparent blur-3xl opacity-30 animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/assets/logo-small.svg" alt="Logo" width={32} height={32} />
            <span className="font-bold text-xl text-white">Vesting Dashboard</span>
          </Link>
          <CustomConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {!isConnected ? (
          <Card className="bg-black/50 backdrop-blur-xl border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="w-16 h-16 text-white/50 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-white/60 text-center mb-6">
                Please connect your wallet to view your vesting streams
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Contract Info */}
            <Card className="bg-black/50 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Vesting Contract</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="text-white/60 hover:text-white"
                  >
                    {copiedAddress ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <code className="text-primary font-mono text-sm">
                    {contractAddress}
                  </code>
                  {getExplorerUrl('address', contractAddress) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-white/60 hover:text-white"
                    >
                      <a
                        href={getExplorerUrl('address', contractAddress)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Coins className="w-8 h-8 text-primary" />
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {activeStreamCount?.toString() || '0'} Active
                    </Badge>
                  </div>
                  <h3 className="text-white/60 text-sm mb-1">Total Allocation</h3>
                  <p className="text-white text-2xl font-bold">
                    {parseFloat(formatUnits(totalAllocation, (tokenDecimals as number) || 18)).toFixed(4)}
                  </p>
                  <p className="text-white/40 text-xs mt-1">{(tokenSymbol as string) || 'Tokens'}</p>
                </CardContent>
              </Card>

              <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-white/60 text-sm mb-1">Total Claimed</h3>
                  <p className="text-white text-2xl font-bold">
                    {parseFloat(formatUnits(totalClaimed, (tokenDecimals as number) || 18)).toFixed(4)}
                  </p>
                  <Progress 
                    value={totalAllocation > BigInt(0) ? Number((totalClaimed * BigInt(100)) / totalAllocation) : 0}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Unlock className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-white/60 text-sm mb-1">Claimable Now</h3>
                  <p className="text-white text-2xl font-bold">
                    {parseFloat(formatUnits(totalClaimableNow, (tokenDecimals as number) || 18)).toFixed(4)}
                  </p>
                  <p className="text-white/40 text-xs mt-1">{(tokenSymbol as string) || 'Tokens'}</p>
                </CardContent>
              </Card>

              <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Timer className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-white/60 text-sm mb-1">TGE Date</h3>
                  <p className="text-white text-lg font-bold">
                    {tgeTimestamp ? formatDate(Number(tgeTimestamp as bigint)) : 'Not set'}
                  </p>
                  {(tgeTimestamp && Number(tgeTimestamp as bigint) > Date.now() / 1000) ? (
                    <Badge variant="outline" className="mt-2 border-blue-400/30 text-blue-400">
                      Upcoming
                    </Badge>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="streams" className="space-y-4">
              <TabsList className="bg-black/50 border border-white/10">
                <TabsTrigger value="streams" className="data-[state=active]:bg-primary/20">
                  <Activity className="w-4 h-4 mr-2" />
                  My Streams
                </TabsTrigger>
                <TabsTrigger value="contract" className="data-[state=active]:bg-primary/20">
                  <FileText className="w-4 h-4 mr-2" />
                  Contract Info
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-primary/20">
                  <Clock className="w-4 h-4 mr-2" />
                  Claim History
                </TabsTrigger>
                {(isOwner as boolean) && (
                  <TabsTrigger value="admin" className="data-[state=active]:bg-primary/20">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Streams Tab */}
              <TabsContent value="streams" className="space-y-4">
                {/* Claim Actions */}
                {totalClaimableNow > BigInt(0) && (
                  <Card className="bg-primary/10 border-primary/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold mb-1">
                            Ready to Claim
                          </h3>
                          <p className="text-white/60 text-sm">
                            You have {parseFloat(formatUnits(totalClaimableNow, (tokenDecimals as number) || 18)).toFixed(4)} {(tokenSymbol as string) || ''} available
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {selectedStreamIds.length > 0 && (
                            <Button
                              onClick={handleClaimSelected}
                              disabled={isClaimBatchPending}
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              {isClaimBatchPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>Claim Selected ({selectedStreamIds.length})</>
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={handleClaimAll}
                            disabled={isClaimAllPending || isClaimAllConfirming}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isClaimAllPending || isClaimAllConfirming ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Claim All'
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Streams List */}
                <div className="space-y-4">
                  {streams.length === 0 ? (
                    <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Info className="w-16 h-16 text-white/30 mb-4" />
                        <p className="text-white/60 text-center">
                          No vesting streams found for your address
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    streams.map((stream) => (
                      <Card key={stream.streamId} className="bg-black/50 backdrop-blur-xl border-white/10">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant={stream.active ? "default" : "secondary"}>
                                Stream #{stream.streamId}
                              </Badge>
                              {stream.active ? (
                                <Badge variant="outline" className="border-green-400/30 text-green-400">
                                  <PlayCircle className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-red-400/30 text-red-400">
                                  <PauseCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedStreamIds.includes(stream.streamId)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStreamIds([...selectedStreamIds, stream.streamId])
                                  } else {
                                    setSelectedStreamIds(selectedStreamIds.filter(id => id !== stream.streamId))
                                  }
                                }}
                                className="w-4 h-4"
                                disabled={!stream.active || stream.claimable === BigInt(0)}
                              />
                              {stream.active && stream.claimable > BigInt(0) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleClaimStream(stream.streamId)}
                                  disabled={isClaimPending || isClaimConfirming}
                                >
                                  {isClaimPending || isClaimConfirming ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Claim'
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-white/60 text-sm">Total Amount</p>
                              <p className="text-white font-medium">
                                {parseFloat(formatUnits(stream.totalAmount, (tokenDecimals as number) || 18)).toFixed(4)}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">Claimed</p>
                              <p className="text-white font-medium">
                                {parseFloat(formatUnits(stream.totalClaimed, (tokenDecimals as number) || 18)).toFixed(4)}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">Claimable</p>
                              <p className="text-green-400 font-medium">
                                {parseFloat(formatUnits(stream.claimable, (tokenDecimals as number) || 18)).toFixed(4)}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">Progress</p>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={stream.totalAmount > BigInt(0) ? Number((stream.totalClaimed * BigInt(100)) / stream.totalAmount) : 0}
                                  className="flex-1"
                                />
                                <span className="text-white text-sm">
                                  {stream.totalAmount > BigInt(0) ? Math.floor(Number((stream.totalClaimed * BigInt(100)) / stream.totalAmount)) : 0}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <Separator className="bg-white/10" />

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-white/60">TGE Release</p>
                              <p className="text-white">{stream.tgeRate / 100}%</p>
                            </div>
                            <div>
                              <p className="text-white/60">Cliff</p>
                              <p className="text-white">{Number(stream.cliff) / (30 * 24 * 60 * 60)} months</p>
                            </div>
                            <div>
                              <p className="text-white/60">Vesting Period</p>
                              <p className="text-white">{stream.period / (24 * 60 * 60)} days</p>
                            </div>
                            <div>
                              <p className="text-white/60">Start Time</p>
                              <p className="text-white">{formatDate(Number(stream.startTime))}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Contract Info Tab */}
              <TabsContent value="contract">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        Contract Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-white/70">Vesting Contract</span>
                            <div className="flex items-center gap-2">
                              <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono text-white">
                                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(contractAddress)}
                                className="p-1 h-auto text-white/70 hover:text-white"
                              >
                                {copiedAddress ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                              {getExplorerUrl('address', contractAddress) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="p-1 h-auto text-white/70 hover:text-white"
                                >
                                  <a href={getExplorerUrl('address', contractAddress)!} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-white/70">Token Address</span>
                            <div className="flex items-center gap-2">
                              {tokenAddress ? (
                                <>
                                  <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono text-white">
                                    {(tokenAddress as string).slice(0, 6)}...{(tokenAddress as string).slice(-4)}
                                  </code>
                                  {getExplorerUrl('address', tokenAddress as string) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                      className="p-1 h-auto text-white/70 hover:text-white"
                                    >
                                      <a href={getExplorerUrl('address', tokenAddress as string)!} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <span className="text-white/50">Not set</span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-white/70">Contract Owner</span>
                            <div className="flex items-center gap-2">
                              {owner ? (
                                <>
                                  <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono text-white">
                                    {(owner as string).slice(0, 6)}...{(owner as string).slice(-4)}
                                  </code>
                                  {isOwner && (
                                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                                      You
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-white/50">Not set</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-white/70 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              TGE Date
                            </span>
                            <span className="text-white font-medium">
                              {tgeTimestamp ? formatDate(Number(tgeTimestamp)) : 'Not set'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-white/70 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Total Locked
                            </span>
                            <span className="text-white font-medium">
                              {totalLocked ? formatUnits(totalLocked as bigint, (tokenDecimals as number) || 18) : '0'} tokens
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-white/70 flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Max Supply
                            </span>
                            <span className="text-white font-medium">
                              {maxTokensToLock ? formatUnits(maxTokensToLock as bigint, (tokenDecimals as number) || 18) : '0'} tokens
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary" />
                          Contract Status
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-white/50 text-sm">Network</p>
                            <p className="text-white font-medium">{chainId === 999 ? 'HyperEVM' : chainId === 42161 ? 'Arbitrum' : 'BSC Testnet'}</p>
                          </div>
                          <div>
                            <p className="text-white/50 text-sm">Active Streams</p>
                            <p className="text-white font-medium">{streams.filter(s => s.active).length}</p>
                          </div>
                          <div>
                            <p className="text-white/50 text-sm">Total Streams</p>
                            <p className="text-white font-medium">{nextStreamId ? Number(nextStreamId) - 1 : 0}</p>
                          </div>
                          <div>
                            <p className="text-white/50 text-sm">Your Streams</p>
                            <p className="text-white font-medium">{streams.length}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="history">
                <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Claim History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : claimHistory.length > 0 ? (
                      <div className="space-y-3">
                        {claimHistory.map((claim) => (
                          <div key={claim.transactionHash} className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-white font-medium mb-1">
                                  Stream #{claim.streamId} - Claimed {parseFloat(claim.claimedAmount).toFixed(4)} tokens
                                </p>
                                <p className="text-white/50 text-sm">
                                  {formatDate(claim.timestamp)}
                                </p>
                              </div>
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                Successful
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-white/70">Transaction</span>
                              <div className="flex items-center gap-1">
                                <code className="text-primary text-xs">
                                  {claim.transactionHash.slice(0, 6)}...{claim.transactionHash.slice(-4)}
                                </code>
                                {getExplorerUrl('tx', claim.transactionHash) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="h-auto p-0"
                                  >
                                    <a
                                      href={getExplorerUrl('tx', claim.transactionHash)!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="w-3 h-3 text-white/60 hover:text-white" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Info className="w-12 h-12 text-white/30 mx-auto mb-3" />
                        <p className="text-white/60">No claim history found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin Tab */}
              {isOwner && (
                <TabsContent value="admin" className="space-y-6">
                  <Alert className="bg-primary/10 border-primary/30">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-white">Admin Access</AlertTitle>
                    <AlertDescription className="text-white/70">
                      You have owner privileges for this vesting contract. Use these tools to manage streams.
                    </AlertDescription>
                  </Alert>

                  {/* Contract Stats */}
                  <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Contract Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-white/60 text-sm mb-1">Total Locked</p>
                          <p className="text-white text-xl font-bold">
                            {parseFloat(formatUnits((totalLocked as bigint) || BigInt(0), (tokenDecimals as number) || 18)).toFixed(4)}
                          </p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-white/60 text-sm mb-1">Max Supply</p>
                          <p className="text-white text-xl font-bold">
                            {parseFloat(formatUnits((maxTokensToLock as bigint) || BigInt(0), (tokenDecimals as number) || 18)).toFixed(4)}
                          </p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-white/60 text-sm mb-1">Contract Balance</p>
                          <p className="text-white text-xl font-bold">
                            {parseFloat(formatUnits((tokenBalance as bigint) || BigInt(0), (tokenDecimals as number) || 18)).toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Deposit Tokens */}
                  <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Coins className="w-5 h-5 text-primary" />
                        Deposit Tokens
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-white/60 text-sm">
                        Transfer tokens from your wallet to the vesting contract for distribution
                      </p>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor="deposit-amount" className="text-white/70">Amount to Deposit</Label>
                          <div className="flex gap-2">
                            <Input
                              id="deposit-amount"
                              placeholder="Enter amount"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                            <div className="flex items-center px-3 bg-white/5 border border-white/10 rounded-md">
                              <span className="text-white/70 text-sm whitespace-nowrap">
                                {(tokenSymbol as string) || 'Tokens'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleDepositTokens}
                          disabled={!depositAmount || isDepositPending || isDepositConfirming || isApprovePending || isApproveConfirming}
                          className="self-end"
                        >
                          {isApprovePending || isApproveConfirming ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Approving...
                            </>
                          ) : isDepositPending || isDepositConfirming ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Depositing...
                            </>
                          ) : (
                            (() => {
                              if (!depositAmount) return 'Deposit Tokens'
                              try {
                                const amountInWei = parseUnits(depositAmount, (tokenDecimals as number) || 18)
                                const currentAllowance = (tokenAllowance as bigint) || BigInt(0)
                                return currentAllowance < amountInWei ? 'Approve & Deposit' : 'Deposit Tokens'
                              } catch {
                                return 'Deposit Tokens'
                              }
                            })()
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Create Stream */}
                  <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Plus className="w-5 h-5 text-primary" />
                          Create New Stream
                        </span>
                        <Button
                          onClick={() => setShowCreateStream(!showCreateStream)}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          {showCreateStream ? 'Cancel' : 'Create Stream'}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    {showCreateStream && (
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white/70">Recipient Address</Label>
                            <Input
                              placeholder="0x..."
                              value={newStreamUser}
                              onChange={(e) => setNewStreamUser(e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70">Amount</Label>
                            <Input
                              placeholder="1000"
                              value={newStreamAmount}
                              onChange={(e) => setNewStreamAmount(e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70">Cliff (months)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newStreamCliff}
                              onChange={(e) => setNewStreamCliff(e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70">TGE Release (%)</Label>
                            <Input
                              type="number"
                              placeholder="10"
                              value={newStreamTgeRate}
                              onChange={(e) => setNewStreamTgeRate(e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70">Release Period (months)</Label>
                            <Input
                              type="number"
                              placeholder="12"
                              value={newStreamReleaseMonths}
                              onChange={(e) => setNewStreamReleaseMonths(e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70">Vesting Period (days)</Label>
                            <Select value={newStreamPeriod} onValueChange={setNewStreamPeriod}>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Daily</SelectItem>
                                <SelectItem value="30">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          onClick={handleCreateStream}
                          disabled={isAddStreamPending || isAddStreamConfirming}
                          className="w-full"
                        >
                          {isAddStreamPending || isAddStreamConfirming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Create Stream'
                          )}
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}