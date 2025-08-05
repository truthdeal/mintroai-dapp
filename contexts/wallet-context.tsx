'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { 
  WalletState, 
  WalletContextValue, 
  WalletType, 
  WalletError,
  NetworkInfo,
  TabSyncMessage 
} from '@/types/wallet';
import { walletService } from '@/services/wallet.service';

// Initial state
const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  walletType: null,
  chainId: null,
  network: null,
  balance: null,
  error: null,
  lastConnected: undefined,
  isInitialized: false
};

// Action types
type WalletAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { address: string; chainId: number; walletType: WalletType } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_ACCOUNT_CHANGED'; payload: string | null }
  | { type: 'SET_CHAIN_CHANGED'; payload: number }
  | { type: 'SET_NETWORK'; payload: NetworkInfo | null }
  | { type: 'SET_BALANCE'; payload: { value: string; formatted: string; symbol: string } | null }
  | { type: 'SET_ERROR'; payload: WalletError | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'RESTORE_STATE'; payload: Partial<WalletState> }
  | { type: 'SYNC_FROM_TAB'; payload: Partial<WalletState> };

// Reducer
function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: action.payload,
        error: action.payload ? null : state.error
      };

    case 'SET_CONNECTED':
      const network = walletService.getNetworkInfo(action.payload.chainId);
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        address: action.payload.address,
        chainId: action.payload.chainId,
        walletType: action.payload.walletType,
        network,
        error: null,
        lastConnected: Date.now()
      };

    case 'SET_DISCONNECTED':
      return {
        ...initialState,
        isInitialized: state.isInitialized
      };

    case 'SET_ACCOUNT_CHANGED':
      return {
        ...state,
        address: action.payload,
        isConnected: !!action.payload
      };

    case 'SET_CHAIN_CHANGED':
      const newNetwork = walletService.getNetworkInfo(action.payload);
      return {
        ...state,
        chainId: action.payload,
        network: newNetwork
      };

    case 'SET_NETWORK':
      return {
        ...state,
        network: action.payload
      };

    case 'SET_BALANCE':
      return {
        ...state,
        balance: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isConnecting: false
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload
      };

    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.payload,
        isInitialized: true
      };

    case 'SYNC_FROM_TAB':
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}

// Context
const WalletContext = createContext<WalletContextValue | undefined>(undefined);

// Provider component
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Event handlers
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    const newAddress = accounts.length > 0 ? accounts[0] : null;
    dispatch({ type: 'SET_ACCOUNT_CHANGED', payload: newAddress });
    
    // Save to storage
    if (newAddress) {
      walletService.saveWalletData({
        address: newAddress,
        chainId: state.chainId,
        walletType: state.walletType,
        lastConnected: Date.now()
      });
    } else {
      walletService.clearStoredWalletData();
    }

    // Broadcast to other tabs
    walletService.broadcastStateChange({
      address: newAddress,
      isConnected: !!newAddress
    });
  }, [state.chainId, state.walletType]);

  const handleChainChanged = useCallback((chainIdHex: string) => {
    const chainId = parseInt(chainIdHex, 16);
    dispatch({ type: 'SET_CHAIN_CHANGED', payload: chainId });
    
    // Save to storage
    if (state.address) {
      walletService.saveWalletData({
        address: state.address,
        chainId,
        walletType: state.walletType,
        lastConnected: Date.now()
      });
    }

    // Broadcast to other tabs
    walletService.broadcastStateChange({
      chainId,
      network: walletService.getNetworkInfo(chainId)
    });
  }, [state.address, state.walletType]);

  const handleConnect = useCallback((connectInfo: any) => {
    console.log('Wallet connected:', connectInfo);
  }, []);

  const handleDisconnect = useCallback((error: any) => {
    console.log('Wallet disconnected:', error);
    dispatch({ type: 'SET_DISCONNECTED' });
    walletService.clearStoredWalletData();
    
    // Broadcast to other tabs
    walletService.broadcastStateChange({
      isConnected: false,
      address: null,
      chainId: null,
      walletType: null
    });
  }, []);

  // Multi-tab sync handler
  const handleTabSync = useCallback((message: TabSyncMessage) => {
    if (message.type === 'WALLET_STATE_CHANGE') {
      dispatch({ type: 'SYNC_FROM_TAB', payload: message.payload });
    }
  }, []);

  // Initialize wallet state
  const initializeWallet = useCallback(async () => {
    try {
      // Check for stored wallet data
      const storedData = walletService.getStoredWalletData();
      
      if (storedData && storedData.address) {
        // Try to restore connection
        const currentAccount = await walletService.getCurrentAccount();
        const currentChainId = await walletService.getCurrentChainId();
        
        if (currentAccount && currentAccount.toLowerCase() === storedData.address.toLowerCase()) {
          dispatch({
            type: 'RESTORE_STATE',
            payload: {
              isConnected: true,
              address: currentAccount,
              chainId: currentChainId,
              walletType: storedData.walletType,
              network: currentChainId ? walletService.getNetworkInfo(currentChainId) : null,
              lastConnected: storedData.lastConnected
            }
          });
        } else {
          // Clear invalid stored data
          walletService.clearStoredWalletData();
          dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
      } else {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    walletService.setupEventListeners(
      handleAccountsChanged,
      handleChainChanged,
      handleConnect,
      handleDisconnect
    );

    // Setup multi-tab sync
    walletService.onBroadcastMessage(handleTabSync);

    // Initialize wallet state
    initializeWallet();

    return () => {
      walletService.removeEventListeners(
        handleAccountsChanged,
        handleChainChanged,
        handleConnect,
        handleDisconnect
      );
    };
  }, [handleAccountsChanged, handleChainChanged, handleConnect, handleDisconnect, handleTabSync, initializeWallet]);

  // Actions
  const connect = useCallback(async (walletType: WalletType) => {
    if (!walletType) {
      throw new Error('Wallet type is required');
    }

    dispatch({ type: 'SET_CONNECTING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const { address, chainId } = await walletService.connectWallet(walletType);
      
      dispatch({
        type: 'SET_CONNECTED',
        payload: { address, chainId, walletType }
      });

      // Save to storage
      walletService.saveWalletData({
        address,
        chainId,
        walletType,
        lastConnected: Date.now()
      });

      // Broadcast to other tabs
      walletService.broadcastStateChange({
        isConnected: true,
        address,
        chainId,
        walletType,
        network: walletService.getNetworkInfo(chainId)
      });

    } catch (error) {
      const walletError: WalletError = {
        type: 'connection',
        message: error instanceof Error ? error.message : 'Failed to connect wallet'
      };
      
      dispatch({ type: 'SET_ERROR', payload: walletError });
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletService.disconnectWallet();
      dispatch({ type: 'SET_DISCONNECTED' });
      
      // Broadcast to other tabs
      walletService.broadcastStateChange({
        isConnected: false,
        address: null,
        chainId: null,
        walletType: null
      });
    } catch (error) {
      const walletError: WalletError = {
        type: 'connection',
        message: error instanceof Error ? error.message : 'Failed to disconnect wallet'
      };
      
      dispatch({ type: 'SET_ERROR', payload: walletError });
      throw error;
    }
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      await walletService.switchNetwork(chainId);
      // Chain change will be handled by the event listener
    } catch (error) {
      const walletError: WalletError = {
        type: 'network',
        message: error instanceof Error ? error.message : 'Failed to switch network'
      };
      
      dispatch({ type: 'SET_ERROR', payload: walletError });
      throw error;
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    // Balance refresh logic would go here
    // For now, this is a placeholder
    console.log('Refresh balance not implemented yet');
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const isWalletSupported = useCallback((walletType: WalletType) => {
    return walletService.isWalletAvailable(walletType);
  }, []);

  const getNetworkByChainId = useCallback((chainId: number) => {
    return walletService.getNetworkInfo(chainId);
  }, []);

  // Context value
  const contextValue: WalletContextValue = {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    clearError,
    isWalletSupported,
    getNetworkByChainId
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useWalletContext(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}