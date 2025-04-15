import { mainnet, polygon, optimism, arbitrum, base, zora } from 'viem/chains'
import { type Chain } from 'viem'

export interface NetworkConfig {
  chain: Chain
  factoryAddress: `0x${string}`
}

export const SUPPORTED_NETWORKS: { [key: number]: NetworkConfig } = {
  // Ethereum Mainnet
  [mainnet.id]: {
    chain: mainnet,
    factoryAddress: "0x1234..." as `0x${string}`, // Mainnet factory address
  },
  // Polygon
  [polygon.id]: {
    chain: polygon,
    factoryAddress: "0x..." as `0x${string}`, // Polygon factory address
  },
  // Optimism
  [optimism.id]: {
    chain: optimism,
    factoryAddress: "0x..." as `0x${string}`, // Optimism factory address
  },
  // Arbitrum
  [arbitrum.id]: {
    chain: arbitrum,
    factoryAddress: "0xB4f2946245D4009B48980C8De88fb84dEF336DD0" as `0x${string}`, // Arbitrum factory address
  },
  // Base
  [base.id]: {
    chain: base,
    factoryAddress: "0x..." as `0x${string}`, // Base factory address
  },
  // Zora
  [zora.id]: {
    chain: zora,
    factoryAddress: "0x..." as `0x${string}`, // Zora factory address
  }
} 