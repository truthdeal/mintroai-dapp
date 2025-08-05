import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import WalletModal from './WalletModal';
import { useWallet, type WalletType } from '@/hooks/useWallet';

interface ConnectWalletButtonProps {
  className?: string;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ className }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { connect, isConnecting } = useWallet();

  const handleWalletSelect = async (walletType: WalletType) => {
    try {
      await connect(walletType);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        disabled={isConnecting}
        className={className}
        data-testid="connect-wallet-button"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectWallet={handleWalletSelect}
      />
    </>
  );
};

export default ConnectWalletButton;