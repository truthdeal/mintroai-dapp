'use client'

import * as React from 'react'
import { NearWalletProvider } from '@/contexts/near-wallet'
import { WalletProvider } from '@/contexts/wallet-context'
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { /* mainnet, polygon, optimism, */ arbitrum, /* base, zora, */ bscTestnet } from 'viem/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error('You need to provide NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID env variable')
}

const config = getDefaultConfig({
  appName: 'MintroAI DApp',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [/* mainnet, polygon, optimism, */ arbitrum, /* base, zora, */ bscTestnet],
  ssr: true,
  appIcon: '/assets/logo-small.png',
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <WalletProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme()} modalSize="compact">
            <NearWalletProvider>
              {mounted && children}
            </NearWalletProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </WalletProvider>
  )
} 