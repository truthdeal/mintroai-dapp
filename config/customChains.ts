import { type Chain } from 'viem'

// Custom HyperEVM chain definition
export const hyperEVM: Chain = {
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Scan',
      url: 'https://hyperevmscan.io',
    },
  },
  testnet: false,
}

// Future custom chains can be added here
// export const customChain2: Chain = { ... } 