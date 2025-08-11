"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { formatUnits, type Address, parseAbiItem } from 'viem'
import { type Chain, arbitrum, bscTestnet } from 'viem/chains'
import vestingABI from '@/constants/vestingContractABI.json'
import { toast } from "sonner"
import { motion } from "framer-motion"
import { 
  Clock, 
  Coins, 
  Calendar, 
  TrendingUp, 
  Wallet, 
  ExternalLink, 
  Copy,
  CheckCircle,
  Info,
  ArrowRight,
  Timer,
  Lock,
  Unlock
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CustomConnectButton } from "@/components/custom-connect-button"
import { format } from "date-fns"

interface VestingDashboardProps {
  contractAddress: string
}

interface ClaimHistoryItem {
  transactionHash: string
  timestamp: number
  claimedAmount: string
  totalClaimed: string
  totalAmount: string
  blockNumber: bigint
}

export function VestingDashboard({ contractAddress }: VestingDashboardProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [copiedAddress, setCopiedAddress] = React.useState(false)
  const [claimHistory, setClaimHistory] = React.useState<ClaimHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)
  
  // Contract read hooks
  const { data: vestingInfo, refetch: refetchVestingInfo } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'getNextVestingInfo',
    args: address ? [address] : undefined,
  })

  const { refetch: refetchClaimable } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'getClaimable',
    args: address ? [address] : undefined,
  })

  const { data: userLockInfo, refetch: refetchUserInfo } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'userToLockInfo',
    args: address ? [address] : undefined,
  })

  const { data: tgeTimestamp } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'tgeTimestamp',
  })

  const { data: tgeRate } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'tgeRate',
  })

  const { data: releaseRate } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'releaseRate',
  })

  const { data: tokenAddress } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'tokenAddress',
  })

  const { data: owner } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'owner',
  })

  const { data: totalLocked } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'totalLocked',
  })

  const { data: period } = useReadContract({
    address: contractAddress as Address,
    abi: vestingABI,
    functionName: 'period',
  })

  // Claim function
  const { 
    writeContract: claimTokens,
    data: claimHash,
    isPending: isClaimPending
  } = useWriteContract()

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  // Handle claim
  const handleClaim = () => {
    try {
      claimTokens({
        address: contractAddress as Address,
        abi: vestingABI,
        functionName: 'claim',
      })
    } catch (error) {
      console.error('Claim error:', error)
      toast.error('Failed to claim tokens')
    }
  }

  // Fetch claim history
  const fetchClaimHistory = React.useCallback(async () => {
    if (!publicClient || !address) return
    
    setIsLoadingHistory(true)
    try {
      const logs = await publicClient.getLogs({
        address: contractAddress as Address,
        event: parseAbiItem('event Claimed(address indexed user, uint256 timestamp, uint256 claimedAmount, uint256 totalClaimed, uint256 totalAmount)'),
        args: {
          user: address,
        },
        fromBlock: 'earliest',
        toBlock: 'latest',
      })

      const history = logs.map((log) => {
        const args = log.args as {
          user?: Address
          timestamp?: bigint
          claimedAmount?: bigint
          totalClaimed?: bigint
          totalAmount?: bigint
        }
        return {
          transactionHash: log.transactionHash,
          timestamp: Number(args.timestamp || 0),
          claimedAmount: formatUnits(args.claimedAmount || BigInt(0), 18),
          totalClaimed: formatUnits(args.totalClaimed || BigInt(0), 18),
          totalAmount: formatUnits(args.totalAmount || BigInt(0), 18),
          blockNumber: log.blockNumber,
        }
      }).reverse() // Most recent first

      setClaimHistory(history)
    } catch (error) {
      console.error('Error fetching claim history:', error)
      toast.error('Failed to fetch claim history')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [publicClient, address, contractAddress])

  // Fetch claim history on mount and when address changes
  React.useEffect(() => {
    if (address && publicClient) {
      fetchClaimHistory()
    }
  }, [address, publicClient, fetchClaimHistory])

  // Refetch data after successful claim
  React.useEffect(() => {
    if (isClaimSuccess) {
      toast.success('Tokens claimed successfully!')
      refetchVestingInfo()
      refetchClaimable()
      refetchUserInfo()
      fetchClaimHistory() // Refresh claim history
    }
  }, [isClaimSuccess, refetchVestingInfo, refetchClaimable, refetchUserInfo, fetchClaimHistory])

  // Get block explorer URL
  const getExplorerUrl = (type: 'address' | 'tx', hash: string) => {
    const chains: Record<number, Chain> = {
      [arbitrum.id]: arbitrum,
      [bscTestnet.id]: bscTestnet,
    }
    
    const chain = chains[chainId]
    if (!chain?.blockExplorers?.default?.url) return null
    
    const baseUrl = chain.blockExplorers.default.url
    return type === 'address' ? `${baseUrl}/address/${hash}` : `${baseUrl}/tx/${hash}`
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

  // Parse vesting info (tuple return type)
  const vestingInfoArray = vestingInfo as [bigint, bigint, bigint, bigint, bigint] | undefined
  const nextVestingTime = vestingInfoArray?.[0] ? Number(vestingInfoArray[0]) : 0
  const nextTotalVestingAmount = vestingInfoArray?.[1] ?? BigInt(0)
  const totalAmount = vestingInfoArray?.[2] ?? BigInt(0)
  const claimedSoFar = vestingInfoArray?.[3] ?? BigInt(0)
  const claimableNow = vestingInfoArray?.[4] ?? BigInt(0)

  // Parse user lock info (tuple return type)
  const userLockInfoArray = userLockInfo as [bigint, bigint] | undefined
  const userTotalAmount = userLockInfoArray?.[0] ?? BigInt(0)
  const userTotalClaimed = userLockInfoArray?.[1] ?? BigInt(0)

  // Calculate progress
  const vestingProgress = totalAmount > BigInt(0) 
    ? Number((claimedSoFar * BigInt(100)) / totalAmount) 
    : 0

  const isOwner = owner && address && (owner as string).toLowerCase() === address.toLowerCase()

  // Format dates
  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'Not set'
    const date = new Date(timestamp * 1000)
    return format(date, "PPP 'at' HH:mm")
  }

  const getTimeUntilNext = (timestamp: number) => {
    if (timestamp === 0) return 'No upcoming vesting'
    const now = Date.now() / 1000
    const diff = timestamp - now
    
    if (diff <= 0) return 'Ready to vest'
    
    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Image src="/assets/logo-small.svg" alt="Logo" width={32} height={32} className="relative z-10" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              MintroAI
            </span>
          </Link>
          <CustomConnectButton />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-white/10"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Vesting Dashboard</h1>
          <div className="flex items-center gap-4 text-white/70">
            <div className="flex items-center gap-2">
              <span>Contract:</span>
              <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono">
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
            {isOwner ? (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                Owner
              </Badge>
            ) : null}
          </div>
        </motion.div>
      </header>

      {!isConnected ? (
        <Card className="bg-black/50 border-white/10 p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-white/50" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-white/70 mb-6">Please connect your wallet to view your vesting information.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-white/70">Total Allocation</CardTitle>
                    <Coins className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {userTotalAmount > BigInt(0) ? formatUnits(userTotalAmount, 18) : '0'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-white/70">Claimed So Far</CardTitle>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {userTotalClaimed > BigInt(0) ? formatUnits(userTotalClaimed, 18) : '0'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-white/70">Claimable Now</CardTitle>
                    <Unlock className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {claimableNow > BigInt(0) ? formatUnits(claimableNow, 18) : '0'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-white/70">Vesting Progress</CardTitle>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-white">{vestingProgress}%</div>
                    <Progress value={vestingProgress} className="h-2 bg-white/10" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Claim Section */}
          {claimableNow > BigInt(0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-primary" />
                    Tokens Available to Claim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-primary mb-2">
                        {formatUnits(claimableNow, 18)}
                      </p>
                      <p className="text-white/70">Tokens are ready to be claimed</p>
                    </div>
                    <Button
                      onClick={handleClaim}
                      disabled={isClaimPending || isClaimConfirming}
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-lg"
                    >
                      {isClaimPending || isClaimConfirming ? (
                        <React.Fragment>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isClaimConfirming ? 'Confirming...' : 'Claiming...'}
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          Claim Tokens
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </React.Fragment>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Detailed Information Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Tabs defaultValue="schedule" className="space-y-4">
              <TabsList className="bg-black/50 border border-white/10">
                <TabsTrigger value="schedule" className="data-[state=active]:bg-primary/20">
                  Vesting Schedule
                </TabsTrigger>
                <TabsTrigger value="contract" className="data-[state=active]:bg-primary/20">
                  Contract Info
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-primary/20">
                  Claim History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="schedule">
                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Vesting Schedule Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <span className="text-white/70 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            TGE Date
                          </span>
                          <span className="text-white font-medium">
                            {tgeTimestamp ? formatDate(Number(tgeTimestamp)) : 'Not set'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <span className="text-white/70 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            TGE Release
                          </span>
                          <span className="text-white font-medium">
                            {tgeRate ? `${Number(tgeRate) / 100}%` : '0%'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <span className="text-white/70 flex items-center gap-2">
                            <Timer className="w-4 h-4" />
                            Release Rate
                          </span>
                          <span className="text-white font-medium">
                            {releaseRate ? `${Number(releaseRate) / 100}% per period` : '0%'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <span className="text-white/70 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Next Vesting
                          </span>
                          <span className="text-white font-medium">
                            {nextVestingTime > 0 ? formatDate(nextVestingTime) : 'No upcoming vesting'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <span className="text-white/70 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Time Until Next
                          </span>
                          <span className="text-white font-medium">
                            {getTimeUntilNext(nextVestingTime)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <span className="text-white/70 flex items-center gap-2">
                            <Coins className="w-4 h-4" />
                            Next Vesting Amount
                          </span>
                          <span className="text-white font-medium">
                            {nextTotalVestingAmount > BigInt(0) 
                              ? formatUnits(nextTotalVestingAmount - claimedSoFar, 18)
                              : '0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vesting Timeline */}
                    <div className="mt-6 p-4 bg-white/5 rounded-lg">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Vesting Timeline
                      </h4>
                      <div className="relative">
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-white/20"></div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                              <p className="text-white font-medium">TGE</p>
                              <p className="text-white/50 text-sm">
                                {tgeRate && tgeTimestamp && Date.now() / 1000 > Number(tgeTimestamp) ? `${Number(tgeRate) / 100}% released` : 'Pending'}
                              </p>
                            </div>
                          </div>

                          {vestingProgress > 0 && vestingProgress < 100 && (
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                              </div>
                              <div>
                                <p className="text-white font-medium">In Progress</p>
                                <p className="text-white/50 text-sm">{vestingProgress}% vested</p>
                              </div>
                            </div>
                          )}

                          {vestingProgress >= 100 ? (
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                                <Unlock className="w-4 h-4 text-green-500" />
                              </div>
                              <div>
                                <p className="text-white font-medium">Fully Vested</p>
                                <p className="text-white/50 text-sm">100% unlocked</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-white/50" />
                              </div>
                              <div>
                                <p className="text-white font-medium">Fully Vested</p>
                                <p className="text-white/50 text-sm">Pending completion</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contract">
                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      Contract Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white/70">Token Address</span>
                        <div className="flex items-center gap-2">
                          {tokenAddress ? (
                            <React.Fragment>
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
                            </React.Fragment>
                          ) : (
                            <span className="text-white/50">Not set</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white/70">Contract Owner</span>
                        <div className="flex items-center gap-2">
                          {owner ? (
                            <React.Fragment>
                              <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono text-white">
                                {(owner as string).slice(0, 6)}...{(owner as string).slice(-4)}
                              </code>
                              {isOwner ? (
                                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                                  {'You'}
                                </Badge>
                              ) : null}
                            </React.Fragment>
                          ) : (
                            <span className="text-white/50">Not set</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white/70">Total Locked</span>
                        <span className="text-white font-medium">
                          {totalLocked ? formatUnits(totalLocked as bigint, 18) : '0'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white/70">Your Allocation</span>
                        <span className="text-white font-medium">
                          {userTotalAmount > BigInt(0) ? formatUnits(userTotalAmount, 18) : '0'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white/70">Vesting Period</span>
                        <span className="text-white font-medium">
                          {period ? `${Number(period) / 86400} days` : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Claim History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-white/70">Loading claim history...</p>
                      </div>
                    ) : claimHistory.length > 0 ? (
                      <div className="space-y-3">
                        {claimHistory.map((claim) => (
                          <div key={claim.transactionHash} className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-white font-medium mb-1">
                                  Claimed {claim.claimedAmount} tokens
                                </p>
                                <p className="text-white/50 text-sm">
                                  {formatDate(claim.timestamp)}
                                </p>
                              </div>
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                Successful
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-white/70">Total Claimed After</span>
                                <span className="text-white">{claim.totalClaimed}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-white/70">Progress</span>
                                <span className="text-white">
                                  {((parseFloat(claim.totalClaimed) / parseFloat(claim.totalAmount)) * 100).toFixed(1)}%
                                </span>
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
                                      className="p-0.5 h-auto text-white/70 hover:text-white"
                                    >
                                      <a href={getExplorerUrl('tx', claim.transactionHash)!} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-white/70">Block</span>
                                <span className="text-white/50">#{claim.blockNumber.toString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-white/30" />
                        <p className="text-white/70">No claim history yet</p>
                        <p className="text-white/50 text-sm mt-2">
                          Your claims will appear here after you claim tokens
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex gap-4 justify-center"
          >
            <Button
              variant="outline"
              asChild
              className="border-white/10 text-white hover:bg-white/10"
            >
              <Link href="/">
                Back to Home
              </Link>
            </Button>
            {getExplorerUrl('address', contractAddress) && (
              <Button
                variant="outline"
                asChild
                className="border-white/10 text-white hover:bg-white/10"
              >
                <a href={getExplorerUrl('address', contractAddress)!} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </a>
              </Button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}