"use client"

import * as React from "react"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type TransactionStatus = 'idle' | 'signing' | 'pending' | 'confirming' | 'success' | 'error'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  status: TransactionStatus
  title?: string
  description?: string
  errorMessage?: string
  txHash?: string
  chainId?: number
}

const statusConfig = {
  idle: {
    icon: null,
    color: 'text-white',
    title: 'Ready',
    description: 'Transaction ready to be initiated'
  },
  signing: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    title: 'Waiting for Signature',
    description: 'Please sign the transaction in your wallet'
  },
  pending: {
    icon: Loader2,
    color: 'text-blue-500',
    title: 'Transaction Submitted',
    description: 'Waiting for transaction to be confirmed'
  },
  confirming: {
    icon: Loader2,
    color: 'text-blue-500',
    title: 'Confirming Transaction',
    description: 'Transaction is being confirmed on the blockchain'
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-500',
    title: 'Transaction Successful',
    description: 'Your transaction has been completed successfully'
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    title: 'Transaction Failed',
    description: 'There was an error processing your transaction'
  }
}

function getExplorerUrl(chainId: number, txHash: string): string | null {
  const explorers: Record<number, string> = {
    42161: 'https://arbiscan.io/tx',
    97: 'https://testnet.bscscan.com/tx',
    999: 'https://hyperevmscan.io/tx',
    998: 'https://hyperevmscan.io/tx'
  }
  
  const baseUrl = explorers[chainId]
  if (!baseUrl) return null
  return `${baseUrl}/${txHash}`
}

export function TransactionModal({
  isOpen,
  onClose,
  status,
  title,
  description,
  errorMessage,
  txHash,
  chainId
}: TransactionModalProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const isLoading = status === 'pending' || status === 'confirming'
  const canClose = status === 'success' || status === 'error' || status === 'idle'
  const explorerUrl = txHash && chainId ? getExplorerUrl(chainId, txHash) : null

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className={cn(
        "bg-black/90 border-white/10 backdrop-blur-xl text-white",
        "w-[90vw] md:w-[400px]",
        "p-6",
        "rounded-lg"
      )}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AlertDialogHeader className="space-y-4">
            {/* Icon */}
            {Icon && (
              <div className="mx-auto">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  status === 'success' && "bg-green-500/20",
                  status === 'error' && "bg-red-500/20",
                  status === 'signing' && "bg-yellow-500/20",
                  (status === 'pending' || status === 'confirming') && "bg-blue-500/20"
                )}>
                  <Icon className={cn(
                    "w-8 h-8",
                    config.color,
                    isLoading && "animate-spin"
                  )} />
                </div>
              </div>
            )}

            {/* Title */}
            <AlertDialogTitle className="text-xl font-bold text-center">
              {title || config.title}
            </AlertDialogTitle>

            {/* Description */}
            <AlertDialogDescription className="text-center text-white/70">
              {description || config.description}
            </AlertDialogDescription>

            {/* Error Message */}
            {status === 'error' && errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">
                <p className="text-sm text-red-300 break-words">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Transaction Hash */}
            {txHash && explorerUrl && (
              <div className="bg-white/5 rounded-lg p-3 mt-3">
                <p className="text-xs text-white/50 mb-1">Transaction Hash</p>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-primary hover:text-primary/80 break-all"
                >
                  {txHash}
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {explorerUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10"
                  onClick={() => window.open(explorerUrl, '_blank')}
                >
                  View on Explorer
                </Button>
              )}
              {canClose && (
                <Button
                  variant="default"
                  size="sm"
                  className={cn(
                    "flex-1",
                    status === 'success' && "bg-green-500 hover:bg-green-600",
                    status === 'error' && "bg-red-500 hover:bg-red-600",
                    status === 'idle' && "bg-primary hover:bg-primary/90"
                  )}
                  onClick={onClose}
                >
                  {status === 'success' ? 'Done' : status === 'error' ? 'Close' : 'OK'}
                </Button>
              )}
            </div>
          </AlertDialogHeader>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  )
}