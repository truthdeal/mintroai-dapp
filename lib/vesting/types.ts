import { Address } from 'viem'

export interface Stream {
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

export interface ClaimHistoryItem {
  transactionHash: string
  timestamp: number
  streamId: number
  claimedAmount: string
  totalClaimed: string
  totalAmount: string
  blockNumber: bigint
}

export interface VestingDashboardProps {
  contractAddress: string
}

export interface StreamFormData {
  user: string
  amount: string
  cliff: string
  tgeRate: string
  releaseMonths: string
  period: string
}

export interface BatchStreamEntry {
  address: Address
  amount: bigint
  cliff: bigint
  releaseRate: number
  tgeRate: number
  period: number
}