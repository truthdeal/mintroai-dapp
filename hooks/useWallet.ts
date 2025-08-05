import { useWalletContext } from '@/contexts/wallet-context';
import { WalletType } from '@/types/wallet';

export function useWallet() {
  const context = useWalletContext();
  
  return {
    // State
    isConnected: context.isConnected,
    isConnecting: context.isConnecting,
    address: context.address,
    chainId: context.chainId,
    network: context.network,
    balance: context.balance,
    error: context.error,
    walletType: context.walletType,
    isInitialized: context.isInitialized,
    
    // Actions
    connect: context.connect,
    disconnect: context.disconnect,
    switchNetwork: context.switchNetwork,
    refreshBalance: context.refreshBalance,
    clearError: context.clearError,
    
    // Utilities
    isWalletSupported: context.isWalletSupported,
    getNetworkByChainId: context.getNetworkByChainId,
  };
}

// Specialized hooks for specific functionality
export function useWalletConnection() {
  const { isConnected, isConnecting, connect, disconnect, error, clearError } = useWallet();
  
  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    error,
    clearError,
  };
}

export function useWalletNetwork() {
  const { chainId, network, switchNetwork, getNetworkByChainId } = useWallet();
  
  return {
    chainId,
    network,
    switchNetwork,
    getNetworkByChainId,
    isNetworkSupported: network?.isSupported ?? false,
  };
}

export function useWalletBalance() {
  const { balance, refreshBalance } = useWallet();
  
  return {
    balance,
    refreshBalance,
    hasBalance: balance && parseFloat(balance.value) > 0,
  };
}

export function useWalletEvents() {
  const { error, clearError } = useWallet();
  
  return {
    error,
    clearError,
    hasError: !!error,
  };
}

// Legacy compatibility - keeping the old WalletType export for backwards compatibility
export type { WalletType };