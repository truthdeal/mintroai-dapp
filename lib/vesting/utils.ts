import { parseUnits, formatUnits, getAddress, type Address } from 'viem'
import { VESTING_CONSTANTS } from './constants'
import type { BatchStreamEntry } from './types'

/**
 * Convert months to release rate format expected by the contract
 */
export function monthsToReleaseRate(months: number): number {
  if (months <= 0 || months > VESTING_CONSTANTS.MAX_RELEASE_MONTHS) {
    throw new Error(`Release months must be between ${VESTING_CONSTANTS.MIN_RELEASE_MONTHS} and ${VESTING_CONSTANTS.MAX_RELEASE_MONTHS}`)
  }
  
  const releaseRate = Math.floor(months * VESTING_CONSTANTS.BASE_RATE)
  
  if (releaseRate > VESTING_CONSTANTS.MAX_UINT40) {
    throw new Error('Release rate value exceeds maximum allowed')
  }
  
  return releaseRate
}

/**
 * Convert release rate back to months for display
 */
export function releaseRateToMonths(releaseRate: number): number {
  if (releaseRate === 0) return 0
  return releaseRate / VESTING_CONSTANTS.BASE_RATE
}

/**
 * Convert percentage to basis points (0-10000)
 */
export function percentageToBasisPoints(percentage: number): number {
  if (percentage < VESTING_CONSTANTS.MIN_TGE_PERCENTAGE || percentage > VESTING_CONSTANTS.MAX_TGE_PERCENTAGE) {
    throw new Error(`TGE percentage must be between ${VESTING_CONSTANTS.MIN_TGE_PERCENTAGE} and ${VESTING_CONSTANTS.MAX_TGE_PERCENTAGE}`)
  }
  
  const basisPoints = Math.floor(percentage * 100)
  
  if (basisPoints > 10000) {
    throw new Error('TGE rate cannot exceed 100%')
  }
  
  return basisPoints
}

/**
 * Convert basis points back to percentage for display
 */
export function basisPointsToPercentage(basisPoints: number): number {
  return basisPoints / 100
}

/**
 * Convert cliff months to seconds
 */
export function cliffMonthsToSeconds(months: number): bigint {
  if (months < VESTING_CONSTANTS.MIN_CLIFF_MONTHS || months > VESTING_CONSTANTS.MAX_CLIFF_MONTHS) {
    throw new Error(`Cliff months must be between ${VESTING_CONSTANTS.MIN_CLIFF_MONTHS} and ${VESTING_CONSTANTS.MAX_CLIFF_MONTHS}`)
  }
  
  return BigInt(Math.floor(months * VESTING_CONSTANTS.DAYS_PER_MONTH * VESTING_CONSTANTS.SECONDS_PER_DAY))
}

/**
 * Convert cliff seconds back to months for display
 */
export function cliffSecondsToMonths(seconds: bigint): number {
  if (seconds === BigInt(0)) return 0
  return Number(seconds) / (VESTING_CONSTANTS.DAYS_PER_MONTH * VESTING_CONSTANTS.SECONDS_PER_DAY)
}

/**
 * Convert period days to seconds
 */
export function periodDaysToSeconds(days: number): number {
  if (days < VESTING_CONSTANTS.MIN_PERIOD_DAYS || days > VESTING_CONSTANTS.MAX_PERIOD_DAYS) {
    throw new Error(`Period days must be between ${VESTING_CONSTANTS.MIN_PERIOD_DAYS} and ${VESTING_CONSTANTS.MAX_PERIOD_DAYS}`)
  }
  
  const seconds = Math.floor(days * VESTING_CONSTANTS.SECONDS_PER_DAY)
  
  if (seconds > VESTING_CONSTANTS.MAX_UINT32) {
    throw new Error('Period value exceeds maximum allowed')
  }
  
  return seconds
}

/**
 * Convert period seconds back to days for display
 */
export function periodSecondsToDays(seconds: number): number {
  if (seconds === 0) return 0
  return seconds / VESTING_CONSTANTS.SECONDS_PER_DAY
}

/**
 * Parse amount string to Wei
 */
export function parseAmountToWei(amount: string, decimals: number = 18): bigint {
  if (!amount || isNaN(Number(amount))) {
    throw new Error('Invalid amount')
  }
  return parseUnits(amount, decimals)
}

/**
 * Format Wei amount to human readable
 */
export function formatWeiToAmount(wei: bigint, decimals: number = 18, precision: number = 4): string {
  const formatted = formatUnits(wei, decimals)
  return parseFloat(formatted).toFixed(precision)
}

/**
 * Ensure address is checksummed
 */
export function ensureChecksumAddress(address: string): Address {
  try {
    return getAddress(address)
  } catch {
    throw new Error(`Invalid address: ${address}`)
  }
}

/**
 * Parse batch stream data from CSV format
 */
export function parseBatchStreamData(
  data: string,
  tokenDecimals: number = 18
): BatchStreamEntry[] {
  const lines = data.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    throw new Error('No valid data found')
  }
  
  const entries: BatchStreamEntry[] = []
  
  lines.forEach((line, index) => {
    const parts = line.split(',').map(s => s.trim())
    
    if (parts.length < 6) {
      throw new Error(`Line ${index + 1} has insufficient data. Expected: address,amount,cliff,releaseMonths,tgePercentage,periodDays`)
    }
    
    const [address, amount, cliff, releaseMonths, tgePercentage, periodDays] = parts
    
    try {
      entries.push({
        address: ensureChecksumAddress(address),
        amount: parseAmountToWei(amount, tokenDecimals),
        cliff: cliffMonthsToSeconds(Number(cliff)),
        releaseRate: monthsToReleaseRate(Number(releaseMonths)),
        tgeRate: percentageToBasisPoints(Number(tgePercentage)),
        period: periodDaysToSeconds(Number(periodDays)),
      })
    } catch (err) {
      throw new Error(`Line ${index + 1}: ${(err as Error).message}`)
    }
  })
  
  return entries
}

/**
 * Validate stream update parameters
 */
export function validateStreamUpdate(
  newAmount: bigint,
  totalClaimed: bigint,
  releaseRate: number,
  tgeRate: number,
  period: number,
  isTgeStarted: boolean,
  originalTgeRate: number
): { valid: boolean; error?: string; adjustedTgeRate?: number } {
  // Check amount is not less than claimed
  if (newAmount < totalClaimed) {
    return { valid: false, error: 'New amount cannot be less than already claimed amount' }
  }
  
  // Check release rate bounds
  if (releaseRate > VESTING_CONSTANTS.MAX_UINT40) {
    return { valid: false, error: 'Release rate value exceeds maximum allowed' }
  }
  
  // Check TGE rate bounds
  if (tgeRate > VESTING_CONSTANTS.MAX_UINT16) {
    return { valid: false, error: 'TGE rate value exceeds maximum allowed' }
  }
  
  // Check period bounds
  if (period > VESTING_CONSTANTS.MAX_UINT32) {
    return { valid: false, error: 'Period value exceeds maximum allowed' }
  }
  
  // If TGE has started, we cannot change TGE rate
  if (isTgeStarted && tgeRate !== originalTgeRate) {
    return { 
      valid: true, 
      adjustedTgeRate: originalTgeRate,
      error: 'TGE rate cannot be changed after TGE has started. Using original TGE rate.' 
    }
  }
  
  return { valid: true }
}

/**
 * Get explorer URL for address or transaction
 */
export function getExplorerUrl(
  chainId: number,
  type: 'address' | 'tx',
  hash: string
): string | null {
  const baseUrl = VESTING_CONSTANTS.EXPLORERS[chainId]
  if (!baseUrl) return null
  return `${baseUrl}/${type}/${hash}`
}

/**
 * Estimate block number for a target date
 */
interface PublicClient {
  getBlockNumber: () => Promise<bigint>
  getBlock: (args: { blockNumber: bigint }) => Promise<{ timestamp: bigint }>
}

export async function estimateBlockForDate(
  publicClient: PublicClient,
  targetDate: Date
): Promise<bigint> {
  try {
    const currentBlock = await publicClient.getBlockNumber()
    const currentBlockData = await publicClient.getBlock({ blockNumber: currentBlock })
    const currentTimestamp = Number(currentBlockData.timestamp)
    
    const targetTimestamp = Math.floor(targetDate.getTime() / 1000)
    const timeDiff = targetTimestamp - currentTimestamp
    
    // Estimate ~2 second block time for most chains
    const blockTime = 2
    const blockDiff = Math.floor(timeDiff / blockTime)
    
    const estimatedBlock = currentBlock + BigInt(blockDiff)
    
    // Ensure we don't go negative
    return estimatedBlock > BigInt(0) ? estimatedBlock : BigInt(1)
  } catch (error) {
    console.error('Error estimating block for date:', error)
    // Fallback to a reasonable default
    return BigInt(1000000)
  }
}