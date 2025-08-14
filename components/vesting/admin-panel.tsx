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
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { PERIOD_OPTIONS } from '@/lib/vesting/constants'
import { 
  ensureChecksumAddress,
  parseBatchStreamData,
  formatWeiToAmount
} from '@/lib/vesting/utils'
import type { Stream } from '@/lib/vesting/types'

interface AdminPanelProps {
  tokenDecimals?: number
  tokenSymbol?: string
  tokenBalance?: bigint
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
}

export function AdminPanel({
  tokenDecimals = 18,
  tokenSymbol = 'Tokens',
  tokenBalance,
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
  isAddMultipleStreamsPending
}: AdminPanelProps) {
  const [showCreateStream, setShowCreateStream] = React.useState(false)
  const [showBatchCreate, setShowBatchCreate] = React.useState(false)
  const [showUserLookup, setShowUserLookup] = React.useState(false)
  const [depositAmount, setDepositAmount] = React.useState('')
  const [userLookupAddress, setUserLookupAddress] = React.useState('')
  const [batchStreamData, setBatchStreamData] = React.useState('')
  
  // Stream creation state
  const [newStreamUser, setNewStreamUser] = React.useState('')
  const [newStreamAmount, setNewStreamAmount] = React.useState('')
  const [newStreamCliff, setNewStreamCliff] = React.useState('0')
  const [newStreamTgeRate, setNewStreamTgeRate] = React.useState('10')
  const [newStreamReleaseMonths, setNewStreamReleaseMonths] = React.useState('12')
  const [newStreamPeriod, setNewStreamPeriod] = React.useState('30')
  
  const isTgeStarted = Boolean(tgeTimestamp && Date.now() / 1000 >= Number(tgeTimestamp))
  
  const handleDepositTokens = () => {
    if (!depositAmount) {
      toast.error('Please enter an amount')
      return
    }
    onDepositTokens(depositAmount)
    setDepositAmount('')
  }
  
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
          
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Button
              onClick={handleDepositTokens}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
              disabled={isDepositPending}
            >
              {isDepositPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
          </div>
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
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {searchResults.map((stream) => (
                    <div key={stream.streamId} className="bg-white/5 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Stream #{stream.streamId}</span>
                        <span className={`text-sm ${stream.active ? 'text-green-400' : 'text-red-400'}`}>
                          {stream.active ? 'Active' : 'Cancelled'}
                        </span>
                      </div>
                      <div className="text-white/60 text-sm mt-1">
                        Amount: {formatWeiToAmount(stream.totalAmount, tokenDecimals)} {tokenSymbol}
                      </div>
                      <div className="text-white/60 text-sm">
                        Claimed: {formatWeiToAmount(stream.totalClaimed, tokenDecimals)} {tokenSymbol}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}