// Chain IDs
export const HYPERLIQUID_CHAINS = {
  mainnet: 998,
  testnet: 999
}

/**
 * Check if the bytecode requires big blocks based on estimated gas
 */
export function requiresBigBlocks(bytecode: string): boolean {
  const bytecodeSize = bytecode.length / 2 // Each byte is 2 hex characters
  const estimatedGas = bytecodeSize * 200 // Rough estimate: ~200 gas per byte
  return estimatedGas > 2000000 // 2M gas threshold
}