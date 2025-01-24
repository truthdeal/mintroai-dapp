import { useEffect } from 'react'
import { useAccount, useNetwork, useBalance } from 'wagmi'

export function useWallet() {
  const account = useAccount()
  const network = useNetwork()
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
    if (network.chain) {
      console.log('Network changed:', network.chain.name)
    }
  }, [network.chain])

  return {
    address: account.address,
    isConnecting: account.status === 'connecting',
    isDisconnected: account.status === 'disconnected',
    chain: network.chain,
    balance,
    isConnected: account.status === 'connected',
  }
} 