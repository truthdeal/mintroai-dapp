import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Clock,
  TrendingUp,
  Lock,
  Calendar,
  Coins,
  Edit2,
  X,
  Check,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { Stream } from '@/lib/vesting/types'
import { 
  formatWeiToAmount,
  releaseRateToMonths,
  basisPointsToPercentage,
  cliffSecondsToMonths,
  periodSecondsToDays
} from '@/lib/vesting/utils'
import { PERIOD_OPTIONS } from '@/lib/vesting/constants'

interface StreamCardProps {
  stream: Stream
  tokenSymbol?: string
  tokenDecimals?: number
  isOwner: boolean
  tgeTimestamp?: bigint
  isSelected?: boolean
  onSelectionChange?: (streamId: number, selected: boolean) => void
  onClaim: (streamId: number) => void
  onCancel: (streamId: number) => void
  onUpdate: (
    streamId: number,
    amount: string,
    releaseMonths: string,
    tgePercentage: string,
    periodDays: string
  ) => void
  isClaimPending?: boolean
  isUpdatePending?: boolean
}

export function StreamCard({
  stream,
  tokenSymbol = 'Tokens',
  tokenDecimals = 18,
  isOwner,
  tgeTimestamp,
  isSelected = false,
  onSelectionChange,
  onClaim,
  onCancel,
  onUpdate,
  isClaimPending,
  isUpdatePending
}: StreamCardProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editAmount, setEditAmount] = React.useState('')
  const [editReleaseMonths, setEditReleaseMonths] = React.useState('')
  const [editTgeRate, setEditTgeRate] = React.useState('')
  const [editPeriod, setEditPeriod] = React.useState('')
  
  const progress = stream.totalAmount > BigInt(0) 
    ? Number((stream.totalClaimed * BigInt(100)) / stream.totalAmount) 
    : 0
  
  const isTgeStarted = tgeTimestamp ? Date.now() / 1000 >= Number(tgeTimestamp) : false
  
  const handleEdit = () => {
    setEditAmount(formatWeiToAmount(stream.totalAmount, tokenDecimals, 18))
    setEditReleaseMonths(releaseRateToMonths(stream.releaseRate).toString())
    setEditTgeRate(basisPointsToPercentage(stream.tgeRate).toString())
    setEditPeriod(periodSecondsToDays(stream.period).toString())
    setIsEditing(true)
  }
  
  const handleSaveEdit = () => {
    if (!editAmount || Number(editAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    onUpdate(
      stream.streamId,
      editAmount,
      editReleaseMonths || releaseRateToMonths(stream.releaseRate).toString(),
      editTgeRate || basisPointsToPercentage(stream.tgeRate).toString(),
      editPeriod || periodSecondsToDays(stream.period).toString()
    )
    
    setIsEditing(false)
  }
  
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditAmount('')
    setEditReleaseMonths('')
    setEditTgeRate('')
    setEditPeriod('')
  }
  
  return (
    <Card className={`bg-black/50 backdrop-blur-xl border-white/10 ${!stream.active ? 'opacity-60' : ''}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            {stream.active && stream.claimable > BigInt(0) && onSelectionChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => 
                  onSelectionChange(stream.streamId, checked as boolean)
                }
                className="border-white/20"
              />
            )}
            <Coins className="w-5 h-5 text-primary" />
            Stream #{stream.streamId}
          </span>
          <div className="flex items-center gap-2">
            {stream.active ? (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                Cancelled
              </Badge>
            )}
            {isOwner && stream.active && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveEdit}
                      disabled={isUpdatePending}
                      className="text-green-400 hover:text-green-300"
                    >
                      {isUpdatePending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEdit}
                      className="text-white/60 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancel(stream.streamId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-white/60 text-sm">Amount ({tokenSymbol})</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-white/40 text-xs mt-1">
                Min: {formatWeiToAmount(stream.totalClaimed, tokenDecimals)} (already claimed)
              </p>
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
              {isTgeStarted && (
                <p className="text-yellow-400 text-xs mt-1">
                  Cannot change after TGE
                </p>
              )}
            </div>
            <div>
              <Label className="text-white/60 text-sm">Vesting Period</Label>
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
        ) : (
          <>
            {/* Amount and Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60 text-sm">Total Allocation</span>
                <span className="text-white font-bold">
                  {formatWeiToAmount(stream.totalAmount, tokenDecimals)} {tokenSymbol}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between items-center mt-2">
                <span className="text-white/40 text-xs">
                  Claimed: {formatWeiToAmount(stream.totalClaimed, tokenDecimals)} {tokenSymbol}
                </span>
                <span className="text-white/40 text-xs">{progress.toFixed(1)}%</span>
              </div>
            </div>
            
            {/* Stream Parameters */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-white/60">Start Time</p>
                  <p className="text-white">
                    {format(new Date(Number(stream.startTime) * 1000), 'PP')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-white/60">Cliff</p>
                  <p className="text-white">
                    {cliffSecondsToMonths(stream.cliff)} months
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-white/60">Release Period</p>
                  <p className="text-white">
                    {releaseRateToMonths(stream.releaseRate).toFixed(1)} months
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-white/60">Vesting Period</p>
                  <p className="text-white">
                    {periodSecondsToDays(stream.period)} days
                  </p>
                </div>
              </div>
            </div>
            
            {/* TGE Info */}
            {stream.tgeRate > 0 && (
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-primary text-sm font-medium">
                  TGE Release: {basisPointsToPercentage(stream.tgeRate)}%
                </p>
                <p className="text-white/60 text-xs mt-1">
                  {formatWeiToAmount(
                    (stream.totalAmount * BigInt(stream.tgeRate)) / BigInt(10000),
                    tokenDecimals
                  )} {tokenSymbol} at TGE
                </p>
              </div>
            )}
            
            {/* Claimable Amount */}
            {stream.active && stream.claimable > BigInt(0) && (
              <div className="bg-green-500/10 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Claimable Now</p>
                    <p className="text-white text-lg font-bold">
                      {formatWeiToAmount(stream.claimable, tokenDecimals)} {tokenSymbol}
                    </p>
                  </div>
                  <Button
                    onClick={() => onClaim(stream.streamId)}
                    disabled={isClaimPending}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {isClaimPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Claim'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}