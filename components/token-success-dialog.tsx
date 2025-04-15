import * as React from "react"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import confetti from 'canvas-confetti'

interface TokenSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
}

export function TokenSuccessDialog({
  isOpen,
  onClose,
  tokenAddress,
  tokenName,
  tokenSymbol
}: TokenSuccessDialogProps) {
  React.useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }, [isOpen])

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-black/90 border-white/10 backdrop-blur-xl text-white p-6 max-w-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AlertDialogHeader className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              Congratulations!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-white/70">
              Your token has been successfully created and deployed to the blockchain!
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-6 space-y-4">
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <div className="text-sm text-white/50">Token Name</div>
                <div className="font-medium">{tokenName}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-white/50">Token Symbol</div>
                <div className="font-medium">{tokenSymbol}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-white/50">Contract Address</div>
                <div className="font-mono text-sm break-all bg-white/5 p-2 rounded border border-white/10">
                  {tokenAddress}
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-white/50">
              You can now add this token to your wallet and start using it!
            </div>
          </div>

          <AlertDialogFooter className="mt-6 flex gap-3">
            <Button
              className="flex-1 bg-white/5 hover:bg-white/10 text-white"
              onClick={() => {
                navigator.clipboard.writeText(tokenAddress)
              }}
            >
              Copy Address
            </Button>
            <Button
              className={cn(
                "flex-1",
                "bg-gradient-to-r from-green-400 to-emerald-400",
                "hover:from-green-500 hover:to-emerald-500",
                "text-white font-medium"
              )}
              onClick={onClose}
            >
              Done
            </Button>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  )
} 