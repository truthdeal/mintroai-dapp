import { useEffect } from 'react'
import { useAccount, useConfig, useBalance, useConnect } from 'wagmi'

export type WalletType = 'metamask' | 'coinbase' | 'walletconnect' | 'rainbow';

export function useWallet() {
  const account = useAccount()
  const config = useConfig()
  const { connectAsync, connectors } = useConnect()
  const { data: balance } = useBalance({
    address: account.address,
  })

  const connect = async (walletType: WalletType) => {
    const connector = connectors.find(c => c.id === walletType)
    if (!connector) {
      throw new Error(`Connector not found for wallet type: ${walletType}`)
    }
    return connectAsync({ connector })
  }

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
    connect,
  }
} 