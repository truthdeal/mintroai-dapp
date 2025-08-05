import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { setupWalletSelector } from '@near-wallet-selector/core'
import { setupModal } from '@near-wallet-selector/modal-ui'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import { setupHereWallet } from '@near-wallet-selector/here-wallet'
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'
import { setupSender } from '@near-wallet-selector/sender'
import type { WalletSelector, AccountState } from '@near-wallet-selector/core'
import type { WalletSelectorModal } from '@near-wallet-selector/modal-ui'
type Optional<T> = T | null

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

interface NearWalletContextValue {
  selector: Optional<WalletSelector>;
  modal: Optional<WalletSelectorModal>;
  accounts: Array<AccountState>;
  accountId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const NearWalletContext = createContext<NearWalletContextValue>({
  selector: null,
  modal: null,
  accounts: [],
  accountId: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: async () => {},
})

export function NearWalletProvider({ children }: { children: React.ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null)
  const [modal, setModal] = useState<WalletSelectorModal | null>(null)
  const [accounts, setAccounts] = useState<Array<AccountState>>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const init = useCallback(async () => {
    try {
      const selector = await setupWalletSelector({
        network: process.env.NEXT_PUBLIC_NEAR_NETWORK_ID === 'mainnet' ? 'mainnet' : 'testnet',
        modules: [
          setupMyNearWallet(),
          setupHereWallet(),
          setupMeteorWallet(),
          setupSender(),
        ],
      })

      const modal = setupModal(selector, {
        contractId: process.env.NEXT_PUBLIC_CONTRACT_ID || '',
      })
      
      const state = selector.store.getState()
      setAccounts(state.accounts)

      window.selector = selector
      window.modal = modal

      setSelector(selector)
      setModal(modal)
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Failed to initialize wallet selector:', error)
    }
  }, [])

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (!selector) return

    const subscription = selector.store.observable.subscribe((state) => {
      setAccounts(state.accounts)
    })

    return () => subscription.unsubscribe()
  }, [selector])

  const connect = async () => {
    if (!modal) return
    setIsConnecting(true)
    setError(null)
    try {
      await modal.show()
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    if (!selector) return
    setError(null)
    try {
      const wallet = await selector.wallet()
      await wallet.signOut()
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const accountId = accounts.length > 0 ? accounts[0].accountId : null
  const isConnected = accounts.length > 0

  return (
    <NearWalletContext.Provider
      value={{
        selector,
        modal,
        accounts,
        accountId,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </NearWalletContext.Provider>
  )
}

export function useNearWallet() {
  return useContext(NearWalletContext)
}