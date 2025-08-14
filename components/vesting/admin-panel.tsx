import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Shield, 
  Upload, 
  Users, 
  Plus,
  Search,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { PERIOD_OPTIONS } from '@/lib/vesting/constants'
import { 
  ensureChecksumAddress,
  parseBatchStreamData,
  formatWeiToAmount,
  releaseRateToMonths,
  basisPointsToPercentage,
  cliffSecondsToMonths,
  periodSecondsToDays
} from '@/lib/vesting/utils'
import type { Stream } from '@/lib/vesting/types'

interface AdminPanelProps {
  tokenDecimals?: number
  tokenSymbol?: string
  tokenBalance?: bigint
  userTokenBalance?: bigint
  totalLocked?: bigint
  maxTokensToLock?: bigint
  isOwner: boolean
  tgeTimestamp?: bigint
  onDepositTokens: (amount: string) => void
  onCreateStream: (
    user: string,
    amount: string,
    cliff: string,
    releaseMonths: string,
    tgeRate: string,
    period: string
  ) => void
  onBatchCreateStreams: (data: string) => void
  onSearchUserStreams: (address: string) => void
  searchResults: Stream[]
  isSearching: boolean
  isDepositPending: boolean
  isAddStreamPending: boolean
  isAddMultipleStreamsPending: boolean
  onUpdateStream: (
    streamId: number,
    amount: string,
    releaseMonths: string,
    tgePercentage: string,
    periodDays: string
  ) => void
  onUpdateSearchedStream?: (
    stream: Stream,
    amount: string,
    releaseMonths: string,
    tgePercentage: string,
    periodDays: string
  ) => void
  onCancelStream: (streamId: number) => void
  isUpdateStreamPending?: boolean
  isDepositSuccess?: boolean
}

export function AdminPanel({
  tokenDecimals = 18,
  tokenSymbol = 'Tokens',
  tokenBalance,
  userTokenBalance,
  totalLocked,
  maxTokensToLock,
  isOwner,
  tgeTimestamp,
  onDepositTokens,
  onCreateStream,
  onBatchCreateStreams,
  onSearchUserStreams,
  searchResults,
  isSearching,
  isDepositPending,
  isAddStreamPending,
  isAddMultipleStreamsPending,
  onUpdateStream,
  onUpdateSearchedStream,
  onCancelStream,
  isUpdateStreamPending = false,
  isDepositSuccess = false
}: AdminPanelProps) {
  const [showCreateStream, setShowCreateStream] = React.useState(false)
  const [showBatchCreate, setShowBatchCreate] = React.useState(false)
  const [showUserLookup, setShowUserLookup] = React.useState(false)
  const [showDepositTokens, setShowDepositTokens] = React.useState(false)
  const [depositAmount, setDepositAmount] = React.useState('')
  const [userLookupAddress, setUserLookupAddress] = React.useState('')
  const [batchStreamData, setBatchStreamData] = React.useState('')
  const [editingStream, setEditingStream] = React.useState<Stream | null>(null)
  const [editAmount, setEditAmount] = React.useState('')
  const [editReleaseMonths, setEditReleaseMonths] = React.useState('')
  const [editTgeRate, setEditTgeRate] = React.useState('')
  const [editPeriod, setEditPeriod] = React.useState('')
  const [isUpdating, setIsUpdating] = React.useState(false)
  
  // Stream creation state
  const [newStreamUser, setNewStreamUser] = React.useState('')
  const [newStreamAmount, setNewStreamAmount] = React.useState('')
  const [newStreamCliff, setNewStreamCliff] = React.useState('0')
  const [newStreamTgeRate, setNewStreamTgeRate] = React.useState('10')
  const [newStreamReleaseMonths, setNewStreamReleaseMonths] = React.useState('12')
  const [newStreamPeriod, setNewStreamPeriod] = React.useState('30')
  
  const isTgeStarted = Boolean(tgeTimestamp && Date.now() / 1000 >= Number(tgeTimestamp))
  
  // React effect to handle successful update
  React.useEffect(() => {

    if (!isUpdateStreamPending && editingStream && isUpdating) {
      // Close the edit form on successful update
      setEditingStream(null)
      setIsUpdating(false)
      // The success toast will be shown by the parent component
      
      // Refresh the search results to show updated data
      if (userLookupAddress) {
        setTimeout(() => {
          onSearchUserStreams(userLookupAddress)
        }, 500)
      }
    }
  }, [isUpdateStreamPending, editingStream, isUpdating, userLookupAddress, onSearchUserStreams])
  
  const handleDepositTokens = () => {
    if (!depositAmount) {
      toast.error('Please enter an amount')
      return
    }
    onDepositTokens(depositAmount)
    // Don't clear the amount here - let the parent component handle it after success
  }
  
  // Clear deposit amount when deposit succeeds
  React.useEffect(() => {
    if (isDepositSuccess && depositAmount) {
      setDepositAmount('')
      setShowDepositTokens(false)
      toast.success('Tokens deposited successfully!')
    }
  }, [isDepositSuccess, depositAmount])
  
  const handleCreateStream = () => {
    if (!newStreamUser || !newStreamAmount) {
      toast.error('Please fill all required fields')
      return
    }
    
    try {
      // Validate address
      ensureChecksumAddress(newStreamUser)
      
      onCreateStream(
        newStreamUser,
        newStreamAmount,
        newStreamCliff,
        newStreamReleaseMonths,
        newStreamTgeRate,
        newStreamPeriod
      )
      
      // Reset form
      setNewStreamUser('')
      setNewStreamAmount('')
      setNewStreamCliff('0')
      setNewStreamTgeRate('10')
      setNewStreamReleaseMonths('12')
      setNewStreamPeriod('30')
      setShowCreateStream(false)
    } catch (err) {
      toast.error(`Invalid input: ${(err as Error).message}`)
    }
  }
  
  const handleBatchCreate = () => {
    if (!batchStreamData) {
      toast.error('Please enter batch stream data')
      return
    }
    
    try {
      // Validate the data format
      parseBatchStreamData(batchStreamData, tokenDecimals)
      
      onBatchCreateStreams(batchStreamData)
      setBatchStreamData('')
      setShowBatchCreate(false)
    } catch (err) {
      toast.error(`Invalid batch data: ${(err as Error).message}`)
    }
  }
  
  const handleUserLookup = () => {
    if (!userLookupAddress) {
      toast.error('Please enter a valid address')
      return
    }
    
    try {
      ensureChecksumAddress(userLookupAddress)
      onSearchUserStreams(userLookupAddress)
    } catch {
      toast.error('Invalid address format')
    }
  }
  
  if (!isOwner) {
    return null
  }
  
  return (
    <Card className="bg-black/50 backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Admin Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-white/60 text-sm mb-1">Contract Balance</p>
            <p className="text-white text-xl font-bold">
              {tokenBalance ? formatWeiToAmount(tokenBalance, tokenDecimals) : '0'}
            </p>
            <p className="text-white/40 text-xs">{tokenSymbol}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-white/60 text-sm mb-1">Total Locked</p>
            <p className="text-white text-xl font-bold">
              {totalLocked ? formatWeiToAmount(totalLocked, tokenDecimals) : '0'}
            </p>
            <p className="text-white/40 text-xs">{tokenSymbol}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-white/60 text-sm mb-1">Max Supply</p>
            <p className="text-white text-xl font-bold">
              {maxTokensToLock ? formatWeiToAmount(maxTokensToLock, tokenDecimals) : '0'}
            </p>
            <p className="text-white/40 text-xs">{tokenSymbol}</p>
          </div>
        </div>
        
        {/* TGE Warning */}
        {isTgeStarted && (
          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              TGE has started. TGE rates cannot be modified for new or existing streams.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => setShowCreateStream(!showCreateStream)}
            className="bg-primary/20 hover:bg-primary/30 text-white border border-primary/30"
            disabled={isAddStreamPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Stream
          </Button>
          
          <Button
            onClick={() => setShowBatchCreate(!showBatchCreate)}
            className="bg-primary/20 hover:bg-primary/30 text-white border border-primary/30"
            disabled={isAddMultipleStreamsPending}
          >
            <Users className="w-4 h-4 mr-2" />
            Batch Create
          </Button>
          
          <Button
            onClick={() => setShowUserLookup(!showUserLookup)}
            className="bg-primary/20 hover:bg-primary/30 text-white border border-primary/30"
          >
            <Search className="w-4 h-4 mr-2" />
            User Lookup
          </Button>
          
          <Button
            onClick={() => setShowDepositTokens(!showDepositTokens)}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
          >
            <Upload className="w-4 h-4 mr-2" />
            Deposit Tokens
          </Button>
        </div>
        
        {/* Create Stream Form */}
        {showCreateStream && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg">
            <h3 className="text-white font-semibold">Create New Stream</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/60">Recipient Address *</Label>
                <Input
                  placeholder="0x..."
                  value={newStreamUser}
                  onChange={(e) => setNewStreamUser(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/60">Amount ({tokenSymbol}) *</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={newStreamAmount}
                  onChange={(e) => setNewStreamAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/60">Cliff (months)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newStreamCliff}
                  onChange={(e) => setNewStreamCliff(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/60">Release Period (months)</Label>
                <Input
                  type="number"
                  placeholder="12"
                  value={newStreamReleaseMonths}
                  onChange={(e) => setNewStreamReleaseMonths(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/60">TGE Release (%)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newStreamTgeRate}
                  onChange={(e) => setNewStreamTgeRate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  disabled={isTgeStarted}
                />
              </div>
              <div>
                <Label className="text-white/60">Vesting Period</Label>
                <Select value={newStreamPeriod} onValueChange={setNewStreamPeriod}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleCreateStream}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isAddStreamPending}
            >
              {isAddStreamPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Stream
            </Button>
          </div>
        )}
        
        {/* Batch Create Form */}
        {showBatchCreate && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg">
            <h3 className="text-white font-semibold">Batch Create Streams</h3>
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertDescription className="text-blue-200">
                Format: address,amount,cliff(months),release(months),tge(%),period(days)
                <br />
                Example: 0x123...,1000,3,12,10,30
              </AlertDescription>
            </Alert>
            <Textarea
              placeholder="Enter stream data (one per line)"
              value={batchStreamData}
              onChange={(e) => setBatchStreamData(e.target.value)}
              className="bg-white/5 border-white/10 text-white min-h-[150px]"
            />
            <Button
              onClick={handleBatchCreate}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isAddMultipleStreamsPending}
            >
              {isAddMultipleStreamsPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Create Batch Streams
            </Button>
          </div>
        )}
        
        {/* User Lookup */}
        {showUserLookup && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg">
            <h3 className="text-white font-semibold">User Stream Lookup</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter user address"
                value={userLookupAddress}
                onChange={(e) => setUserLookupAddress(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button
                onClick={handleUserLookup}
                className="bg-primary hover:bg-primary/90"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-white/60 text-sm">
                  Found {searchResults.length} stream(s)
                </p>
                <div className="max-h-[600px] overflow-y-auto space-y-3">
                  {searchResults.map((stream) => {
                    const releaseMonths = Math.round(releaseRateToMonths(stream.releaseRate, periodSecondsToDays(stream.period)))
                    const tgePercentage = basisPointsToPercentage(stream.tgeRate)
                    const cliffMonths = Math.round(cliffSecondsToMonths(stream.cliff))
                    const periodDays = periodSecondsToDays(stream.period)
                    const progress = stream.totalAmount > BigInt(0) 
                      ? Number((stream.totalClaimed * BigInt(100)) / stream.totalAmount)
                      : 0
                    const startDate = new Date(Number(stream.startTime) * 1000)
                    
                    return (
                      <div key={stream.streamId} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">Stream #{stream.streamId}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                stream.active 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {stream.active ? 'Active' : 'Cancelled'}
                              </span>
                            </div>
                            <p className="text-white/40 text-xs mt-1">
                              Started: {startDate.toLocaleDateString()} {startDate.toLocaleTimeString()}
                            </p>
                          </div>
                          
                          {stream.active && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                onClick={() => {
                                  setEditingStream(stream)
                                  setEditAmount(formatWeiToAmount(stream.totalAmount, tokenDecimals, 18))
                                  setEditReleaseMonths(releaseMonths.toString())
                                  setEditTgeRate(tgePercentage.toString())
                                  setEditPeriod(periodDays.toString())
                                }}
                                disabled={isUpdateStreamPending}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to cancel stream #${stream.streamId}?`)) {
                                    onCancelStream(stream.streamId)
                                    // Refresh search results after a short delay
                                    setTimeout(() => {
                                      if (userLookupAddress) {
                                        onSearchUserStreams(userLookupAddress)
                                      }
                                    }, 1500)
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Amount Information */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-white/60 text-xs mb-1">Total Amount</p>
                            <p className="text-white font-semibold">
                              {formatWeiToAmount(stream.totalAmount, tokenDecimals)} {tokenSymbol}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs mb-1">Claimed</p>
                            <p className="text-green-400 font-semibold">
                              {formatWeiToAmount(stream.totalClaimed, tokenDecimals)} {tokenSymbol}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60">Progress</span>
                            <span className="text-white/60">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Stream Parameters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white/5 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3 text-white/40" />
                              <p className="text-white/60 text-xs">Cliff</p>
                            </div>
                            <p className="text-white text-sm font-medium">
                              {cliffMonths} months
                            </p>
                          </div>
                          
                          <div className="bg-white/5 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Calendar className="w-3 h-3 text-white/40" />
                              <p className="text-white/60 text-xs">Release</p>
                            </div>
                            <p className="text-white text-sm font-medium">
                              {releaseMonths} months
                            </p>
                          </div>
                          
                          <div className="bg-white/5 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <TrendingUp className="w-3 h-3 text-white/40" />
                              <p className="text-white/60 text-xs">TGE</p>
                            </div>
                            <p className="text-white text-sm font-medium">
                              {tgePercentage}%
                            </p>
                          </div>
                          
                          <div className="bg-white/5 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3 text-white/40" />
                              <p className="text-white/60 text-xs">Period</p>
                            </div>
                            <p className="text-white text-sm font-medium">
                              {periodDays === 1 ? 'Daily' : 
                               periodDays === 7 ? 'Weekly' :
                               periodDays === 30 ? 'Monthly' :
                               periodDays === 90 ? 'Quarterly' :
                               `${periodDays} days`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Claimable Amount */}
                        {stream.active && stream.claimable > BigInt(0) && (
                          <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/30">
                            <p className="text-green-400 text-sm">
                              Claimable Now: {formatWeiToAmount(stream.claimable, tokenDecimals)} {tokenSymbol}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Edit Stream Modal */}
            {editingStream && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/30">
                <h4 className="text-white font-semibold mb-3">Edit Stream #{editingStream.streamId}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-white/60 text-sm">Amount ({tokenSymbol})</Label>
                    <Input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/60 text-sm">Release Period (months)</Label>
                    <Input
                      type="number"
                      value={editReleaseMonths}
                      onChange={(e) => setEditReleaseMonths(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/60 text-sm">TGE Release (%)</Label>
                    <Input
                      type="number"
                      value={editTgeRate}
                      onChange={(e) => setEditTgeRate(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      disabled={isTgeStarted}
                    />
                  </div>
                  <div>
                    <Label className="text-white/60 text-sm">Vesting Period (days)</Label>
                    <Select value={editPeriod} onValueChange={setEditPeriod}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!editAmount || !editReleaseMonths) {
                        toast.error('Please fill all required fields')
                        return
                      }
                      
                      try {
                        setIsUpdating(true)
                        
                        // Log for debugging
                        console.log('Updating stream from admin panel:', {
                          streamId: editingStream.streamId,
                          amount: editAmount,
                          releaseMonths: editReleaseMonths,
                          tgeRate: editTgeRate,
                          period: editPeriod,
                          stream: editingStream
                        })
                        
                        // Use onUpdateSearchedStream if available (for searched streams)
                        // Otherwise fall back to onUpdateStream (for user's own streams)
                        if (onUpdateSearchedStream) {
                          onUpdateSearchedStream(
                            editingStream,
                            editAmount,
                            editReleaseMonths,
                            editTgeRate,
                            editPeriod
                          )
                        } else {
                          onUpdateStream(
                            editingStream.streamId,
                            editAmount,
                            editReleaseMonths,
                            editTgeRate,
                            editPeriod
                          )
                        }
                        // Don't close the form here - wait for success callback
                      } catch (error) {
                        console.error('Update error:', error)
                        toast.error('Failed to update stream')
                        setIsUpdating(false)
                      }
                    }}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isUpdateStreamPending || isUpdating}
                  >
                    {(isUpdateStreamPending || isUpdating) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="w-4 h-4 mr-2" />
                    )}
                    Update Stream
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingStream(null)
                      setIsUpdating(false)
                    }}
                    variant="outline"
                    className="flex-1 border-white/10 text-white hover:bg-white/10"
                    disabled={isUpdateStreamPending || isUpdating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Deposit Tokens Section */}
        {showDepositTokens && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg">
            <h3 className="text-white font-semibold">Deposit Tokens to Contract</h3>
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertDescription className="text-blue-200">
                Deposit tokens to the vesting contract. This will first request approval for the contract to spend your tokens, then deposit them.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              {/* Token Balance Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded p-3">
                  <p className="text-white/60 text-sm mb-1">Your Wallet Balance</p>
                  <p className="text-white font-semibold">
                    {userTokenBalance ? formatWeiToAmount(userTokenBalance, tokenDecimals) : '0'} {tokenSymbol}
                  </p>
                </div>
                <div className="bg-white/5 rounded p-3">
                  <p className="text-white/60 text-sm mb-1">Contract Balance</p>
                  <p className="text-white font-semibold">
                    {tokenBalance ? formatWeiToAmount(tokenBalance, tokenDecimals) : '0'} {tokenSymbol}
                  </p>
                </div>
                <div className="bg-white/5 rounded p-3">
                  <p className="text-white/60 text-sm mb-1">Total Locked</p>
                  <p className="text-white font-semibold">
                    {totalLocked ? formatWeiToAmount(totalLocked, tokenDecimals) : '0'} {tokenSymbol}
                  </p>
                </div>
              </div>
              
              {/* Deposit Amount Input */}
              <div>
                <Label className="text-white/60">Amount to Deposit ({tokenSymbol})</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              
              {/* Deposit Button */}
              <Button
                onClick={handleDepositTokens}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={isDepositPending || !depositAmount}
              >
                {isDepositPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Approve & Deposit {depositAmount ? `${depositAmount} ${tokenSymbol}` : 'Tokens'}
                  </>
                )}
              </Button>
              
              {/* Instructions */}
              <div className="text-white/40 text-xs space-y-1">
                <p>• Step 1: Approve the contract to spend your tokens</p>
                <p>• Step 2: Deposit tokens to the contract</p>
                <p>• Both transactions will be requested automatically</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}