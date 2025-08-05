import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { type WalletType } from '@/hooks/useWallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletType: WalletType) => void;
}

interface WalletError {
  message: string;
}

interface WalletConnectionError {
  message?: string;
  toString: () => string;
}

const POPULAR_WALLETS = [
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '/assets/wallets/rainbow.svg',
    description: 'Connect with Rainbow Wallet',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/assets/wallets/coinbase.svg',
    description: 'Connect with Coinbase Wallet',
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/assets/wallets/metamask.svg',
    description: 'Connect to your MetaMask Wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '/assets/wallets/walletconnect.svg',
    description: 'Connect with WalletConnect',
  },
];

const NEAR_WALLETS = [
  {
    id: 'near-wallet',
    name: 'NEAR Wallet',
    icon: '/assets/wallets/near.svg',
    description: 'Connect to NEAR Wallet',
  },
  {
    id: 'sender',
    name: 'Sender',
    icon: '/assets/wallets/sender.svg',
    description: 'Connect with Sender Wallet',
  },
  {
    id: 'here-wallet',
    name: 'HERE Wallet',
    icon: '/assets/wallets/here.svg',
    description: 'Connect with HERE Wallet',
  },
  {
    id: 'meteor-wallet',
    name: 'Meteor Wallet',
    icon: '/assets/wallets/meteor.svg',
    description: 'Connect with Meteor Wallet',
  }
];

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onSelectWallet }) => {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState<WalletError | null>(null);
  const [selectedWallet, setSelectedWallet] = React.useState<string | null>(null);

  const handleWalletSelect = async (walletType: WalletType) => {
    setIsConnecting(true);
    setError(null);
    setSelectedWallet(walletType);
    
    try {
      await onSelectWallet(walletType);
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      setError(getErrorFromException(err as WalletConnectionError));
    } finally {
      setIsConnecting(false);
    }
  };

  const getErrorFromException = (err: WalletConnectionError): WalletError => {
    const message = err.message || err.toString();
    
    if (message.includes('User rejected') || message.includes('user rejected')) {
      return { message: 'Connection was rejected. Please try again.' };
    }
    
    return { message: 'Something went wrong. Please try again.' };
  };

  const handleRetry = () => {
    if (selectedWallet) {
      handleWalletSelect(selectedWallet as WalletType);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto"
        data-testid="wallet-modal"
      >
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <DialogClose data-testid="modal-close-button" />
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800" data-testid="wallet-error-message">
                {error.message}
              </p>
              <button
                onClick={handleRetry}
                className="ml-4 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="popular"
              data-testid="wallet-tab-popular"
            >
              Popular
            </TabsTrigger>
            <TabsTrigger 
              value="near"
              data-testid="wallet-tab-near"
            >
              NEAR Wallet
            </TabsTrigger>
          </TabsList>
          
          {/* Popular EVM Wallets */}
          <TabsContent value="popular">
            <div className="grid gap-4">
              {POPULAR_WALLETS.map((wallet) => (
                <Card
                  key={wallet.id}
                  className="flex cursor-pointer items-center p-4 hover:bg-accent"
                  onClick={() => handleWalletSelect(wallet.id as WalletType)}
                  data-testid={`wallet-option-${wallet.id}`}
                >
                  <div className="mr-4">
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={32}
                      height={32}
                      data-testid={`${wallet.id}-icon`}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{wallet.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {wallet.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* NEAR Wallets */}
          <TabsContent value="near" data-testid="near-wallets-section">
            <div className="grid gap-4">
              {NEAR_WALLETS.map((wallet) => (
                <Card
                  key={wallet.id}
                  className="flex cursor-pointer items-center p-4 hover:bg-accent"
                  onClick={() => handleWalletSelect(wallet.id as WalletType)}
                  data-testid={`wallet-option-${wallet.id}`}
                >
                  <div className="mr-4">
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={32}
                      height={32}
                      data-testid={`${wallet.id}-icon`}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{wallet.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {wallet.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {isConnecting && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            data-testid="wallet-connecting-loader"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;