import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { useState } from 'react'
import WalletModal from './wallet/WalletModal'

interface EthereumWindow extends Window {
  ethereum?: {
    request: (args: { method: string }) => Promise<string[]>;
  };
}

export function CustomConnectButton() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        if (!ready) {
          return null
        }

        const handleWalletSelect = async (walletType: string, isNearWallet?: boolean) => {
          // Loading state'i göstermek için kısa bir bekleme
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (isNearWallet) {
            // NEAR cüzdan bağlantı mantığı
            console.log('Connecting to NEAR wallet:', walletType)
            // TODO: NEAR cüzdan bağlantısı için gerekli işlemleri yap
            setIsWalletModalOpen(false)
          } else {
            // EVM cüzdanları için önce window.ethereum kontrolü yap
            const ethWindow = window as EthereumWindow;
            if (typeof window !== 'undefined' && ethWindow.ethereum?.request) {
              try {
                // Test için window.ethereum.request'i çağır
                await ethWindow.ethereum.request({ method: 'eth_requestAccounts' });
                openConnectModal()
                setIsWalletModalOpen(false)
              } catch (error) {
                // Error'ı WalletModal'a ilet
                throw error;
              }
            } else {
              // Normal RainbowKit flow
              openConnectModal()
              setIsWalletModalOpen(false)
            }
          }
        }

        return (
          <div className="flex items-center gap-2">
            {(() => {
              if (!mounted || !account || !chain) {
                return (
                  <>
                    <Button
                      onClick={() => setIsWalletModalOpen(true)}
                      variant="outline"
                      className="gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                      data-testid="connect-wallet-button"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </Button>

                    <WalletModal
                      isOpen={isWalletModalOpen}
                      onClose={() => setIsWalletModalOpen(false)}
                      onSelectWallet={handleWalletSelect}
                    />
                  </>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    className="gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    Wrong Network
                  </Button>
                )
              }

              return (
                <>
                  <Button
                    onClick={openChainModal}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                  >
                    {chain.hasIcon && (
                      <div className="w-4 h-4 overflow-hidden rounded-full">
                        {chain.iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  <Button
                    onClick={openAccountModal}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                  >
                    <Wallet className="w-4 h-4" />
                    {account.displayBalance ? `${account.displayBalance}  ` : ''} 
                    {account.displayName}
                  </Button>
                </>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}