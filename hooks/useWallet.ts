import { useEffect } from 'react'
import { useAccount, useConfig, useBalance } from 'wagmi'

export function useWallet() {
  const account = useAccount()
  const config = useConfig()
  const { data: balance } = useBalance({
    address: account.address,
  })

  useEffect(() => {
    // Account change handler
    if (account.status === 'connected') {
      console.log('Wallet connected:', account.address)
    } else if (account.status === 'disconnected') {
      console.log('Wallet disconnected')
    }
  }, [account.status, account.address])

  useEffect(() => {
    // Network change handler
    const chain = config.chains.find(c => c.id === config.state.chainId)
    if (chain) {
      console.log('Network changed:', chain.name)
    }
  }, [config.state.chainId, config.chains])

  return {
    address: account.address,
    isConnecting: account.status === 'connecting',
    isDisconnected: account.status === 'disconnected',
    chain: config.chains.find(c => c.id === config.state.chainId),
    balance,
    isConnected: account.status === 'connected',
  }
} 