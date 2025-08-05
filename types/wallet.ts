export type WalletType = 'evm' | 'near' | null;

export type WalletErrorType = 'network' | 'connection' | 'account' | 'permission' | null;

export interface NetworkInfo {
  name: string;
  chainId: number;
  isSupported: boolean;
  isTestnet?: boolean;
}

export interface WalletError {
  type: WalletErrorType;
  message: string | null;
  code?: string | number;
}

export interface WalletState {
  // Connection Status
  isConnected: boolean;
  isConnecting: boolean;
  
  // Wallet Information
  address: string | null;
  walletType: WalletType;
  
  // Network Information
  chainId: number | null;
  network: NetworkInfo | null;
  
  // Balance Information (optional)
  balance?: {
    value: string;
    formatted: string;
    symbol: string;
  } | null;
  
  // Error State
  error: WalletError | null;
  
  // Metadata
  lastConnected?: number; // timestamp
  isInitialized: boolean;
}

export interface WalletActions {
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

export interface WalletContextValue extends WalletState, WalletActions {
  // Additional context-specific methods
  isWalletSupported: (walletType: WalletType) => boolean;
  getNetworkByChainId: (chainId: number) => NetworkInfo | null;
}

// Event types for wallet state changes
export type WalletEventType = 
  | 'accountsChanged'
  | 'chainChanged'
  | 'connect'
  | 'disconnect'
  | 'message';

export interface WalletEvent {
  type: WalletEventType;
  data: any;
  timestamp: number;
}

// Storage types
export interface WalletStorageData {
  address: string | null;
  chainId: number | null;
  walletType: WalletType;
  lastConnected: number;
}

// Multi-tab communication types
export interface TabSyncMessage {
  type: 'WALLET_STATE_CHANGE' | 'WALLET_DISCONNECT' | 'WALLET_CONNECT';
  payload: Partial<WalletState>;
  timestamp: number;
  tabId: string;
}

// Supported networks configuration
export interface SupportedNetwork extends NetworkInfo {
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Wallet provider types (for different wallet implementations)
export interface WalletProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isConnected?: () => boolean;
  chainId?: string;
  selectedAddress?: string;
}

declare global {
  interface Window {
    ethereum?: WalletProvider;
  }
}