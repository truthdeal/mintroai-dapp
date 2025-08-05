import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Wallet, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useNearWallet } from '@/contexts/near-wallet'
import { useWallet } from '@/hooks/useWallet'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const WALLET_OPTIONS = [
  {
    id: 'popular',
    name: 'Popular',
    icon: '/assets/wallets/metamask.svg',
    isNearWallet: false
  },
  {
    id: 'near',
    name: 'NEAR Wallet',
    icon: '/assets/wallets/near.svg',
    isNearWallet: true
  }
]

export function CustomConnectButton() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { disconnect: disconnectNear, accountId: nearAccountId, isConnected: isNearConnected } = useNearWallet()
  const { 
    isConnected: isWalletConnected, 
    address: walletAddress, 
    connect: connectWallet, 
    disconnect: disconnectWallet,
    chainId,
    network 
  } = useWallet()

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
            try {
              if (typeof window !== 'undefined' && (window as any).modal) {
                await (window as any).modal.show()
                setIsDropdownOpen(false)
              } else {
                throw new Error('NEAR wallet selector modal is not initialized')
              }
            } catch (error) {
              console.error('Failed to connect NEAR wallet:', error)
              throw error
            }
          } else {
            try {
              // Use our new wallet state management system
              await connectWallet('evm');
              setIsDropdownOpen(false)
            } catch (error) {
              console.error('Failed to connect EVM wallet:', error)
              // Fallback to RainbowKit if our system fails
              openConnectModal()
              setIsDropdownOpen(false)
            }
          }
        }

        return (
          <div className="flex items-center gap-2">
            {(() => {
              // Check if any wallet is connected (EVM or NEAR)
              const isAnyWalletConnected = isWalletConnected || isNearConnected || (mounted && account && chain);
              
              if (!isAnyWalletConnected) {
                return (
                  <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[180px] justify-between border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                        data-testid="connect-wallet-button"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          <span>Connect Wallet</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="min-w-[180px] p-2"
                      sideOffset={8}
                    >
                      {WALLET_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.id}
                          onClick={() => handleWalletSelect(option.id, option.isNearWallet)}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-primary/5 rounded-md transition-colors duration-200"
                          data-testid={`wallet-option-${option.id}`}
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            <Image
                              src={option.icon}
                              alt={option.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          </div>
                          <span className="font-medium text-sm">{option.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              if (chain?.unsupported) {
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

              // Show EVM wallet if connected via our new system
              if (isWalletConnected && walletAddress) {
                return (
                  <Button
                    onClick={disconnectWallet}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                  >
                    <Wallet className="w-4 h-4" />
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    {network && ` (${network.name})`}
                  </Button>
                )
              }

              if (isNearConnected) {
                return (
                  <Button
                    onClick={disconnectNear}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                  >
                    <Image
                      src="/assets/wallets/near.svg"
                      alt="NEAR"
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    {nearAccountId}
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
                    {chain?.hasIcon && (
                      <div className="w-4 h-4 overflow-hidden rounded-full">
                        {chain?.iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={chain?.name ?? 'Chain icon'}
                            src={chain?.iconUrl}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    )}
                    {chain?.name}
                  </Button>

                  <Button
                    onClick={openAccountModal}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                  >
                    <Wallet className="w-4 h-4" />
                    {account?.displayBalance ? `${account?.displayBalance}  ` : ''} 
                    {account?.displayName}
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