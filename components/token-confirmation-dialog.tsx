"use client"

import * as React from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { TokenFormValues } from "./token-creation-form"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TokenConfirmationDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  formData: TokenFormValues
  deploymentStatus: 'idle' | 'creating' | 'compiling' | 'deploying' | 'success' | 'error'
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-xs font-medium",
      enabled 
        ? "bg-green-500/20 text-green-400 border border-green-500/20" 
        : "bg-red-500/10 text-red-400 border border-red-500/20"
    )}>
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function ValueDisplay({ value, symbol }: { value: string | number, symbol?: string }) {
  return (
    <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded">
      {value}{symbol}
    </span>
  )
}

export function TokenConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  formData,
  deploymentStatus
}: TokenConfirmationDialogProps) {
  const getButtonContent = () => {
    switch (deploymentStatus) {
      case 'creating':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Creating Contract...</span>
          </div>
        )
      case 'compiling':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Compiling Contract...</span>
          </div>
        )
      case 'deploying':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Deploying Contract...</span>
          </div>
        )
      case 'success':
        return (
          <div className="flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Deployment Successful!</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Deployment Failed</span>
          </div>
        )
      default:
        return 'Create Token'
    }
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className={cn(
        "bg-black/90 border-white/10 backdrop-blur-xl text-white",
        "w-[90vw] md:w-[400px]",
        "p-3",
        "overflow-y-auto rounded-lg",
        "max-h-[95vh] md:max-h-[85vh]"
      )}>
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </button>

        <AlertDialogHeader className="space-y-1">
          <AlertDialogTitle className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Confirm Token Creation
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70 text-xs">
            You are about to create a new token with the following parameters:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-2 space-y-2">
          <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-3">
            {/* Basic Details */}
            <div>
              <div className="text-white/50 text-sm font-medium mb-2">Basic Details</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-white/50">Token Name:</span>
                <ValueDisplay value={formData.name} />
                <span className="text-white/50">Symbol:</span>
                <ValueDisplay value={formData.symbol} />
                <span className="text-white/50">Initial Supply:</span>
                <ValueDisplay value={formData.initialSupply} symbol={` ${formData.symbol}`} />
                <span className="text-white/50">Decimals:</span>
                <ValueDisplay value={formData.decimals} />
              </div>
            </div>

            {/* Features */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-white/50 text-sm font-medium mb-2">Features</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'mintable', label: 'Mintable' },
                  { key: 'burnable', label: 'Burnable' },
                  { key: 'pausable', label: 'Pausable' },
                  { key: 'blacklist', label: 'Blacklist' },
                  { key: 'antiBot', label: 'Anti-Bot' }
                ].map(({ key, label }) => (
                  <span
                    key={key}
                    className={cn(
                      "px-2 py-1 rounded-full text-xs flex items-center gap-1.5",
                      formData[key as keyof TokenFormValues]
                        ? "bg-primary/20 text-primary border border-primary/20"
                        : "bg-white/5 text-white/50 border border-white/10"
                    )}
                  >
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      formData[key as keyof TokenFormValues]
                        ? "bg-primary"
                        : "bg-white/20"
                    )} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Transaction Limits */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-white/50 text-sm font-medium mb-2">Transaction Limits</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-white/50">Max Transaction:</span>
                <StatusBadge enabled={formData.maxTx} />
                <span className="text-white/50">Max Amount:</span>
                <ValueDisplay value={formData.maxTxAmount} symbol={` ${formData.symbol}`} />
              </div>
            </div>

            {/* Taxes */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-white/50 text-sm font-medium mb-2">Taxes</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-white/50">Transfer Tax:</span>
                <ValueDisplay value={`${formData.transferTax}%`} />
              </div>
            </div>

            {/* Security Settings */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-white/50 text-sm font-medium mb-2">Security Settings</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-white/50">Anti-Bot:</span>
                <StatusBadge enabled={formData.antiBot} />
                <span className="text-white/50">Cooldown:</span>
                <ValueDisplay value={`${formData.cooldownTime}s`} />
              </div>
            </div>
          </div>

          <div className="text-white/70 text-xs">
            Please review the details carefully before proceeding.
          </div>
        </div>

        <AlertDialogFooter className="mt-2 flex gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-10"
            disabled={deploymentStatus !== 'idle' && deploymentStatus !== 'error'}
          >
            {deploymentStatus === 'error' ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "flex-1 h-10",
              deploymentStatus === 'success' 
                ? "bg-green-500 hover:bg-green-600" 
                : deploymentStatus === 'error'
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:bg-primary/90",
              "text-white"
            )}
            disabled={deploymentStatus !== 'idle' && deploymentStatus !== 'error'}
          >
            {getButtonContent()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 