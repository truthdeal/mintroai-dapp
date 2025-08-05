import { 
  WalletState, 
  WalletType, 
  NetworkInfo, 
  WalletProvider, 
  SupportedNetwork,
  WalletStorageData,
  TabSyncMessage
} from '@/types/wallet';

// Supported networks configuration
const SUPPORTED_NETWORKS: Record<number, SupportedNetwork> = {
  1: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    isSupported: true,
    isTestnet: false,
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  11155111: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    isSupported: true,
    isTestnet: true,
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Sepolia Ethereum',
      symbol: 'SEP',
      decimals: 18
    }
  },
  137: {
    name: 'Polygon Mainnet',
    chainId: 137,
    isSupported: true,
    isTestnet: false,
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    }
  }
};

export class WalletService {
  private static instance: WalletService;
  private provider: WalletProvider | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private tabId: string;
  
  private constructor() {
    this.tabId = this.generateTabId();
    this.initBroadcastChannel();
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  // Initialize broadcast channel for multi-tab communication
  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('wallet-state-sync');
    }
  }

  // Generate unique tab ID
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get wallet provider (MetaMask, etc.)
  public getProvider(): WalletProvider | null {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  }

  // Check if wallet is available
  public isWalletAvailable(walletType: WalletType): boolean {
    switch (walletType) {
      case 'evm':
        return typeof window !== 'undefined' && !!window.ethereum;
      case 'near':
        // Check for NEAR wallet availability
        return typeof window !== 'undefined' && !!(window as unknown as { near?: unknown }).near;
      default:
        return false;
    }
  }

  // Connect to wallet
  public async connectWallet(walletType: WalletType): Promise<{
    address: string;
    chainId: number;
  }> {
    if (walletType === 'evm') {
      return this.connectEVMWallet();
    } else if (walletType === 'near') {
      return this.connectNEARWallet();
    }
    
    throw new Error(`Unsupported wallet type: ${walletType}`);
  }

  // Connect EVM wallet (MetaMask, etc.)
  private async connectEVMWallet(): Promise<{ address: string; chainId: number }> {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error('No EVM wallet found');
    }

    try {
      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get chain ID
      const chainId = await provider.request({
        method: 'eth_chainId'
      });

      this.provider = provider;

      return {
        address: accounts[0],
        chainId: parseInt(chainId, 16)
      };
    } catch (error) {
      throw new Error(`Failed to connect EVM wallet: ${error}`);
    }
  }

  // Connect NEAR wallet
  private async connectNEARWallet(): Promise<{ address: string; chainId: number }> {
    // NEAR wallet connection logic would go here
    // For now, return a placeholder
    throw new Error('NEAR wallet connection not implemented yet');
  }

  // Disconnect wallet
  public async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.clearStoredWalletData();
  }

  // Get current account
  public async getCurrentAccount(): Promise<string | null> {
    if (!this.provider) return null;

    try {
      const accounts = await this.provider.request({
        method: 'eth_accounts'
      });
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Failed to get current account:', error);
      return null;
    }
  }

  // Get current chain ID
  public async getCurrentChainId(): Promise<number | null> {
    if (!this.provider) return null;

    try {
      const chainId = await this.provider.request({
        method: 'eth_chainId'
      });
      return parseInt(chainId, 16);
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      return null;
    }
  }

  // Get network info by chain ID
  public getNetworkInfo(chainId: number): NetworkInfo | null {
    const network = SUPPORTED_NETWORKS[chainId];
    if (!network) return null;

    return {
      name: network.name,
      chainId: network.chainId,
      isSupported: network.isSupported,
      isTestnet: network.isTestnet
    };
  }

  // Switch network
  public async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }

    const network = SUPPORTED_NETWORKS[chainId];
    if (!network) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    try {
      // Try to switch to the network
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
          } catch (switchError: unknown) {
      // If network is not added to wallet, add it
      if ((switchError as { code?: number })?.code === 4902) {
        await this.provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: network.name,
            rpcUrls: network.rpcUrls,
            blockExplorerUrls: network.blockExplorerUrls,
            nativeCurrency: network.nativeCurrency
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  // Setup event listeners
  public setupEventListeners(
    onAccountChange: (accounts: string[]) => void,
    onChainChange: (chainId: string) => void,
    onConnect: (connectInfo: unknown) => void,
    onDisconnect: (error: unknown) => void
  ): void {
    if (!this.provider) return;

    this.provider.on('accountsChanged', onAccountChange);
    this.provider.on('chainChanged', onChainChange);
    this.provider.on('connect', onConnect);
    this.provider.on('disconnect', onDisconnect);
  }

  // Remove event listeners
  public removeEventListeners(
    onAccountChange: (accounts: string[]) => void,
    onChainChange: (chainId: string) => void,
    onConnect: (connectInfo: unknown) => void,
    onDisconnect: (error: unknown) => void
  ): void {
    if (!this.provider) return;

    this.provider.removeListener('accountsChanged', onAccountChange);
    this.provider.removeListener('chainChanged', onChainChange);
    this.provider.removeListener('connect', onConnect);
    this.provider.removeListener('disconnect', onDisconnect);
  }

  // Storage methods
  public saveWalletData(data: WalletStorageData): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('wallet-data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save wallet data:', error);
    }
  }

  public getStoredWalletData(): WalletStorageData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem('wallet-data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get stored wallet data:', error);
      return null;
    }
  }

  public clearStoredWalletData(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('wallet-data');
    } catch (error) {
      console.error('Failed to clear wallet data:', error);
    }
  }

  // Multi-tab synchronization
  public broadcastStateChange(state: Partial<WalletState>): void {
    if (!this.broadcastChannel) return;

    const message: TabSyncMessage = {
      type: 'WALLET_STATE_CHANGE',
      payload: state,
      timestamp: Date.now(),
      tabId: this.tabId
    };

    try {
      this.broadcastChannel.postMessage(message);
    } catch (error) {
      console.error('Failed to broadcast state change:', error);
    }
  }

  public onBroadcastMessage(callback: (message: TabSyncMessage) => void): void {
    if (!this.broadcastChannel) return;

    this.broadcastChannel.onmessage = (event) => {
      const message = event.data as TabSyncMessage;
      
      // Ignore messages from the same tab
      if (message.tabId === this.tabId) return;
      
      callback(message);
    };
  }

  // Cleanup
  public cleanup(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}

export const walletService = WalletService.getInstance();