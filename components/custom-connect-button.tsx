import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

export function CustomConnectButton() {
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

        return (
          <div className="flex items-center gap-2">
            {(() => {
              if (!mounted || !account || !chain) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="outline"
                    className="gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </Button>
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