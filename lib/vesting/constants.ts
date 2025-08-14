export const VESTING_CONSTANTS = {
  // Base rate for release rate calculations (from contract)
  // This is used in the formula: releaseRate = 21600000000 / months * period / 30
  // For standard 30-day period: releaseRate = 21600000000 / months
  BASE_RATE: 21600000000,
  
  // Time conversions
  SECONDS_PER_DAY: 86400,
  DAYS_PER_MONTH: 30,
  
  // Bounds for contract parameters
  MAX_UINT40: 1099511627775, // 2^40 - 1
  MAX_UINT32: 4294967295, // 2^32 - 1
  MAX_UINT16: 65535, // 2^16 - 1
  
  // Validation limits
  MIN_RELEASE_MONTHS: 1,
  MAX_RELEASE_MONTHS: 100,
  MIN_TGE_PERCENTAGE: 0,
  MAX_TGE_PERCENTAGE: 100,
  MIN_PERIOD_DAYS: 1,
  MAX_PERIOD_DAYS: 365,
  MIN_CLIFF_MONTHS: 0,
  MAX_CLIFF_MONTHS: 24,
  
  // UI defaults
  DEFAULT_CLIFF_MONTHS: 0,
  DEFAULT_TGE_PERCENTAGE: 10,
  DEFAULT_RELEASE_MONTHS: 12,
  DEFAULT_PERIOD_DAYS: 30,
  
  // Blockchain explorers
  EXPLORERS: {
    42161: 'https://arbiscan.io', // Arbitrum
    97: 'https://testnet.bscscan.com', // BSC Testnet
    999: 'https://hyperevmscan.io', // HyperEVM
  } as Record<number, string>,
} as const

export const PERIOD_OPTIONS = [
  { value: '1', label: 'Daily' },
  { value: '7', label: 'Weekly' },
  { value: '30', label: 'Monthly' },
  { value: '90', label: 'Quarterly' },
] as const