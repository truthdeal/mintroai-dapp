"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { type Address } from 'viem'
import hyperVestingABI from '@/constants/hyperVestingABI.json'
import erc20ABI from '@/constants/erc20ABI.json'
import { toast } from "sonner"
import { 
  Coins, 
  Wallet, 
  ExternalLink, 
  Copy,
  CheckCircle,
  Timer,
  Unlock,
  Loader2,
  Activity,
  FileText,
  Shield
} from 'lucide-react'
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import Image from 'next/image'
import { CustomConnectButton } from "@/components/custom-connect-button"
import { format } from "date-fns"

// Vesting modules
import type { VestingDashboardProps, Stream } from '@/lib/vesting/types'
import { 
  useVestingStreams, 
  useTokenApproval, 
  useClaimHistory,
  useStreamSearch,
  useCreateStream
} from '@/lib/vesting/hooks'
import { 
  parseAmountToWei,
  monthsToReleaseRate,
  percentageToBasisPoints,
  periodDaysToSeconds,
  parseBatchStreamData,
  formatWeiToAmount,
  validateStreamUpdate,
  getExplorerUrl
} from '@/lib/vesting/utils'
import { AdminPanel } from '@/components/vesting/admin-panel'
import { StreamCard } from '@/components/vesting/stream-card'

export function VestingDashboardStreams({ contractAddress }: VestingDashboardProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // State
  const [copiedAddress, setCopiedAddress] = React.useState(false)
  const [depositAmount, setDepositAmount] = React.useState('')
  const [selectedStreamIds, setSelectedStreamIds] = React.useState<number[]>([])
  
  // Use custom hooks
  const { streams, refetch: refetchStreams } = useVestingStreams(contractAddress, address)
  const { history: claimHistory, refetch: refetchHistory } = useClaimHistory(contractAddress, address)
  const { searchResults, isSearching, searchUserStreams } = useStreamSearch(contractAddress)
  
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
  
  // Create stream hook after tokenDecimals is available
  const { 
    createStream, 
    isAddStreamPending, 
    isAddStreamSuccess 
  } = useCreateStream(contractAddress, Number(tokenDecimals) || 18)

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: contractAddress ? [contractAddress as Address] : undefined,
  })

  // Token approval hook
  const {
    approveToken,
    allowance: tokenAllowance,
    // isApprovePending,
    isApproveSuccess,
    refetchAllowance
  } = useTokenApproval(tokenAddress as Address, contractAddress as Address, address)

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
    writeContract: updateStream,
    data: updateStreamHash,
    isPending: isUpdateStreamPending
  } = useWriteContract()
  
  const {
    writeContract: cancelStreamContract,
    data: cancelStreamHash,
  } = useWriteContract()
  
  const {
    writeContract: addMultipleStreams,
    data: addMultipleStreamsHash,
    isPending: isAddMultipleStreamsPending
  } = useWriteContract()

  const { 
    writeContract: depositTokens,
    data: depositHash,
    isPending: isDepositPending
  } = useWriteContract()

  // Transaction confirmations
  const { /* isLoading: isClaimConfirming, */ isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  const { isLoading: isClaimAllConfirming, isSuccess: isClaimAllSuccess } = useWaitForTransactionReceipt({
    hash: claimAllHash,
  })

  const { /* isLoading: isUpdateStreamConfirming, */ isSuccess: isUpdateStreamSuccess } = useWaitForTransactionReceipt({
    hash: updateStreamHash,
  })
  
  const { isSuccess: isCancelStreamSuccess } = useWaitForTransactionReceipt({
    hash: cancelStreamHash,
  })
  
  const { /* isLoading: isAddMultipleStreamsConfirming, */ isSuccess: isAddMultipleStreamsSuccess } = useWaitForTransactionReceipt({
    hash: addMultipleStreamsHash,
  })

  const { /* isLoading: isDepositConfirming, */ isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  // Effects for success notifications
  React.useEffect(() => {
    if (isClaimSuccess) {
      toast.success('Tokens claimed successfully!')
      refetchStreams()
      refetchHistory()
    }
  }, [isClaimSuccess, refetchStreams, refetchHistory])

  React.useEffect(() => {
    if (isClaimAllSuccess) {
      toast.success('All tokens claimed successfully!')
      refetchStreams()
      refetchHistory()
    }
  }, [isClaimAllSuccess, refetchStreams, refetchHistory])

  React.useEffect(() => {
    if (isAddStreamSuccess) {
      toast.success('Stream created successfully!')
      refetchStreams()
      refetchTotalLocked()
    }
  }, [isAddStreamSuccess, refetchStreams, refetchTotalLocked])
  
  React.useEffect(() => {
    if (isUpdateStreamSuccess) {
      toast.success('Stream updated successfully!')
      refetchStreams()
      refetchTotalLocked()
    }
  }, [isUpdateStreamSuccess, refetchStreams, refetchTotalLocked])
  
  React.useEffect(() => {
    if (isCancelStreamSuccess) {
      toast.success('Stream cancelled successfully!')
      refetchStreams()
      refetchTotalLocked()
    }
  }, [isCancelStreamSuccess, refetchStreams, refetchTotalLocked])
  
  React.useEffect(() => {
    if (isAddMultipleStreamsSuccess) {
      toast.success('Batch streams created successfully!')
      refetchStreams()
      refetchTotalLocked()
    }
  }, [isAddMultipleStreamsSuccess, refetchStreams, refetchTotalLocked])

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
        const amountInWei = parseAmountToWei(depositAmount, (tokenDecimals as number) || 18)
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

  const handleCancelStream = (streamId: number) => {
    if (!confirm('Are you sure you want to cancel this stream? This action cannot be undone.')) {
      return
    }

    try {
      cancelStreamContract({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'cancelStream',
        args: [BigInt(streamId)],
      })
    } catch (error) {
      console.error('Cancel stream error:', error)
      toast.error('Failed to cancel stream: ' + (error as Error).message)
    }
  }
  
  const handleUpdateStream = (
    streamId: number,
    amount: string,
    releaseMonths: string,
    tgePercentage: string,
    periodDays: string
  ) => {
    const stream = streams.find(s => s.streamId === streamId)
    if (!stream) {
      toast.error('Stream not found')
      return
    }
    
    try {
      const amountInWei = parseAmountToWei(amount, (tokenDecimals as number) || 18)
      const releaseRate = monthsToReleaseRate(Number(releaseMonths), Number(periodDays))
      const tgeRate = percentageToBasisPoints(Number(tgePercentage))
      const period = periodDaysToSeconds(Number(periodDays))
      
      // Validate the update
      const isTgeStarted = Boolean(tgeTimestamp && Date.now() / 1000 >= Number(tgeTimestamp as bigint))
      const validation = validateStreamUpdate(
        amountInWei,
        stream.totalClaimed,
        releaseRate,
        tgeRate,
        period,
        isTgeStarted,
        stream.tgeRate
      )
      
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid stream parameters')
        return
      }
      
      if (validation.adjustedTgeRate !== undefined) {
        toast.warning(validation.error || 'TGE rate adjusted')
      }
      
      updateStream({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'updateStream',
        args: [
          BigInt(streamId),
          amountInWei,
          releaseRate,
          validation.adjustedTgeRate ?? tgeRate,
          period,
        ],
      })
    } catch (error) {
      console.error('Update stream error:', error)
      toast.error('Failed to update stream: ' + (error as Error).message)
    }
  }

  // Handler specifically for updating searched streams (from admin panel)
  const handleUpdateSearchedStream = (
    stream: Stream, // Stream object passed from admin panel
    amount: string,
    releaseMonths: string,
    tgePercentage: string,
    periodDays: string
  ) => {
    try {
      const amountInWei = parseAmountToWei(amount, (tokenDecimals as number) || 18)
      const releaseRate = monthsToReleaseRate(Number(releaseMonths), Number(periodDays))
      const tgeRate = percentageToBasisPoints(Number(tgePercentage))
      const period = periodDaysToSeconds(Number(periodDays))
      
      // Validate the update
      const isTgeStarted = Boolean(tgeTimestamp && Date.now() / 1000 >= Number(tgeTimestamp as bigint))
      const validation = validateStreamUpdate(
        amountInWei,
        stream.totalClaimed,
        releaseRate,
        tgeRate,
        period,
        isTgeStarted,
        stream.tgeRate
      )
      
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid stream parameters')
        return
      }
      
      if (validation.adjustedTgeRate !== undefined) {
        toast.warning(validation.error || 'TGE rate adjusted')
      }
      
      console.log('Updating searched stream:', {
        streamId: stream.streamId,
        amountInWei: amountInWei.toString(),
        releaseRate,
        tgeRate: validation.adjustedTgeRate ?? tgeRate,
        period
      })
      
      updateStream({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'updateStream',
        args: [
          BigInt(stream.streamId),
          amountInWei,
          releaseRate,
          validation.adjustedTgeRate ?? tgeRate,
          period,
        ],
      })
    } catch (error) {
      console.error('Update searched stream error:', error)
      toast.error('Failed to update stream: ' + (error as Error).message)
    }
  }

  const handleDepositTokens = async () => {
    if (!depositAmount) {
      toast.error('Please enter an amount')
      return
    }

    if (!tokenAddress) {
      toast.error('Token address not found. Please check contract configuration.')
      return
    }

    try {
      const amountInWei = parseAmountToWei(depositAmount, (tokenDecimals as number) || 18)
      console.log('Deposit amount in wei:', amountInWei.toString())
      console.log('Token address:', tokenAddress)
      console.log('Contract address:', contractAddress)
      
      // Check if we need approval
      const currentAllowance = tokenAllowance || BigInt(0)
      console.log('Current allowance:', currentAllowance.toString())
      
      if (currentAllowance < amountInWei) {
        // Need approval first
        toast.info('Approval required. Please check your wallet for the approval request.')
        await approveToken(amountInWei)
      } else {
        // Already approved, proceed with deposit
        console.log('Sufficient allowance, depositing tokens')
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

  const handleBatchCreateStreams = (data: string) => {
    try {
      const entries = parseBatchStreamData(data, (tokenDecimals as number) || 18)
      
      const users = entries.map(e => e.address)
      const amounts = entries.map(e => e.amount)
      const cliffs = entries.map(e => e.cliff)
      const releaseRates = entries.map(e => e.releaseRate)
      const tgeRates = entries.map(e => e.tgeRate)
      const periods = entries.map(e => e.period)
      
      addMultipleStreams({
        address: contractAddress as Address,
        abi: hyperVestingABI,
        functionName: 'addMultipleStreams',
        args: [users, amounts, cliffs, releaseRates, tgeRates, periods],
      })
    } catch (error) {
      console.error('Batch create error:', error)
      toast.error('Failed to create batch streams: ' + (error as Error).message)
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

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    {formatWeiToAmount(totalAllocation, (tokenDecimals as number) || 18)}
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
                    {formatWeiToAmount(totalClaimed, (tokenDecimals as number) || 18)}
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
                    {formatWeiToAmount(totalClaimableNow, (tokenDecimals as number) || 18)}
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
            <Tabs defaultValue="streams" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-black/50">
                <TabsTrigger value="streams" className="text-white data-[state=active]:bg-primary/20">
                  <Activity className="w-4 h-4 mr-2" />
                  Active Streams
                </TabsTrigger>
                <TabsTrigger value="contract" className="text-white data-[state=active]:bg-primary/20">
                  <FileText className="w-4 h-4 mr-2" />
                  Contract Info
                </TabsTrigger>
                <TabsTrigger value="history" className="text-white data-[state=active]:bg-primary/20">
                  <Timer className="w-4 h-4 mr-2" />
                  Claim History
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="admin" className="text-white data-[state=active]:bg-primary/20">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Control
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="streams" className="space-y-6">
                {/* Bulk Actions */}
                {streams.filter(s => s.active && s.claimable > BigInt(0)).length > 0 && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleClaimAll}
                      disabled={isClaimAllPending || isClaimAllConfirming}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {(isClaimAllPending || isClaimAllConfirming) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Claim All Available ({formatWeiToAmount(totalClaimableNow, (tokenDecimals as number) || 18)} {(tokenSymbol as string) || 'Tokens'})
                    </Button>
                    
                    {selectedStreamIds.length > 0 && (
                      <Button
                        onClick={handleClaimSelected}
                        disabled={isClaimBatchPending}
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                      >
                        {isClaimBatchPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Claim Selected ({selectedStreamIds.length})
                      </Button>
                    )}
                  </div>
                )}

                {/* Stream Cards */}
                <div className="grid gap-4">
                  {streams.length === 0 ? (
                    <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                      <CardContent className="py-12 text-center">
                        <p className="text-white/60">No vesting streams found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    streams.map((stream) => (
                      <StreamCard
                        key={stream.streamId}
                        stream={stream}
                        tokenSymbol={(tokenSymbol as string) || 'Tokens'}
                        tokenDecimals={(tokenDecimals as number) || 18}
                        isOwner={isOwner}
                        tgeTimestamp={tgeTimestamp as bigint}
                        isSelected={selectedStreamIds.includes(stream.streamId)}
                        onSelectionChange={(streamId, selected) => {
                          if (selected) {
                            setSelectedStreamIds(prev => [...prev, streamId])
                          } else {
                            setSelectedStreamIds(prev => prev.filter(id => id !== streamId))
                          }
                        }}
                        onClaim={handleClaimStream}
                        onCancel={handleCancelStream}
                        onUpdate={handleUpdateStream}
                        isClaimPending={isClaimPending}
                        isUpdatePending={isUpdateStreamPending}
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {claimHistory.length === 0 ? (
                  <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                    <CardContent className="py-12 text-center">
                      <p className="text-white/60">No claim history found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {claimHistory.map((item, index) => (
                      <Card key={index} className="bg-black/50 backdrop-blur-xl border-white/10">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-medium">
                                Stream #{item.streamId}
                              </p>
                              <p className="text-white/60 text-sm">
                                {formatDate(item.timestamp)}
                              </p>
                              <p className="text-green-400 text-sm mt-1">
                                +{formatWeiToAmount(BigInt(item.claimedAmount), (tokenDecimals as number) || 18)} {(tokenSymbol as string) || 'Tokens'}
                              </p>
                            </div>
                            {getExplorerUrl(chainId, 'tx', item.transactionHash) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-white/60 hover:text-white"
                              >
                                <a
                                  href={getExplorerUrl(chainId, 'tx', item.transactionHash)!}
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
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contract" className="space-y-4">
                <Card className="bg-black/50 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Contract Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contract Address */}
                    <div>
                      <Label className="text-white/60 text-sm">Contract Address</Label>
                      <div className="flex items-center justify-between mt-2 p-3 bg-white/5 rounded-lg">
                        <code className="text-primary font-mono text-sm">
                          {contractAddress}
                        </code>
                        <div className="flex gap-2">
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
                          {getExplorerUrl(chainId, 'address', contractAddress) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-white/60 hover:text-white"
                            >
                              <a
                                href={getExplorerUrl(chainId, 'address', contractAddress)!}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Token Address */}
                    <div>
                      <Label className="text-white/60 text-sm">Token Address</Label>
                      <div className="flex items-center justify-between mt-2 p-3 bg-white/5 rounded-lg">
                        <code className="text-primary font-mono text-sm">
                          {(tokenAddress as string) || 'Loading...'}
                        </code>
                        {tokenAddress && getExplorerUrl(chainId, 'address', tokenAddress as string) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-white/60 hover:text-white"
                          >
                            <a
                              href={getExplorerUrl(chainId, 'address', tokenAddress as string)!}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {/* Contract Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <p className="text-white/60 text-sm mb-1">Token Symbol</p>
                        <p className="text-white text-xl font-bold">
                          {(tokenSymbol as string) || 'Loading...'}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg">
                        <p className="text-white/60 text-sm mb-1">Token Decimals</p>
                        <p className="text-white text-xl font-bold">
                          {tokenDecimals?.toString() || 'Loading...'}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg">
                        <p className="text-white/60 text-sm mb-1">Contract Balance</p>
                        <p className="text-white text-xl font-bold">
                          {tokenBalance ? formatWeiToAmount(tokenBalance as bigint, (tokenDecimals as number) || 18) : '0'}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg">
                        <p className="text-white/60 text-sm mb-1">Total Locked</p>
                        <p className="text-white text-xl font-bold">
                          {totalLocked ? formatWeiToAmount(totalLocked as bigint, (tokenDecimals as number) || 18) : '0'}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg">
                        <p className="text-white/60 text-sm mb-1">Max Supply</p>
                        <p className="text-white text-xl font-bold">
                          {maxTokensToLock ? formatWeiToAmount(maxTokensToLock as bigint, (tokenDecimals as number) || 18) : '0'}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg">
                        <p className="text-white/60 text-sm mb-1">Owner</p>
                        <p className="text-primary text-xs font-mono break-all">
                          {(owner as string) || 'Loading...'}
                        </p>
                      </div>
                    </div>

                    {/* TGE Information */}
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h4 className="text-white font-semibold mb-3">TGE Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">TGE Date:</span>
                          <span className="text-white">
                            {tgeTimestamp ? formatDate(Number(tgeTimestamp as bigint)) : 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Status:</span>
                          {tgeTimestamp && Number(tgeTimestamp as bigint) > Date.now() / 1000 ? (
                            <Badge variant="outline" className="border-blue-400/30 text-blue-400">
                              Upcoming
                            </Badge>
                          ) : tgeTimestamp ? (
                            <Badge variant="outline" className="border-green-400/30 text-green-400">
                              Started
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-400/30 text-gray-400">
                              Not Set
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {isOwner && (
                <TabsContent value="admin" className="space-y-4">
                  <AdminPanel
                    tokenDecimals={(tokenDecimals as number) || 18}
                    tokenSymbol={(tokenSymbol as string) || 'Tokens'}
                    tokenBalance={tokenBalance as bigint}
                    totalLocked={totalLocked as bigint}
                    maxTokensToLock={maxTokensToLock as bigint}
                    isOwner={isOwner}
                    tgeTimestamp={tgeTimestamp as bigint}
                    onDepositTokens={handleDepositTokens}
                    onCreateStream={createStream}
                    onBatchCreateStreams={handleBatchCreateStreams}
                    onSearchUserStreams={searchUserStreams}
                    searchResults={searchResults}
                    isSearching={isSearching}
                    isDepositPending={isDepositPending}
                    isAddStreamPending={isAddStreamPending}
                    isAddMultipleStreamsPending={isAddMultipleStreamsPending}
                    onUpdateStream={handleUpdateStream}
                    onUpdateSearchedStream={handleUpdateSearchedStream}
                    onCancelStream={handleCancelStream}
                    isUpdateStreamPending={isUpdateStreamPending}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}