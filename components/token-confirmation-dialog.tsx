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
}

export function TokenConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  formData
}: TokenConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className={cn(
        "bg-black/90 border-white/10 backdrop-blur-xl text-white",
        "w-[90vw] md:w-[400px]",
        "p-4 shadow-lg",
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

        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Confirm Token Creation
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70 text-sm">
            You are about to create a new token with the following parameters:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-3 space-y-3">
          <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-3">
            {/* Basic Details */}
            <div>
              <div className="text-white/50 text-sm font-medium mb-1.5">Basic Details</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span className="text-white/50">Token Name:</span>
                <span className="text-white">{formData.name}</span>
                <span className="text-white/50">Symbol:</span>
                <span className="text-white">{formData.symbol}</span>
                <span className="text-white/50">Initial Supply:</span>
                <span className="text-white">{formData.initialSupply} {formData.symbol}</span>
                <span className="text-white/50">Decimals:</span>
                <span className="text-white">{formData.decimals}</span>
              </div>
            </div>

            {/* Features */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-white/50 text-sm font-medium mb-1.5">Features</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'mintable', label: 'Mintable' },
                  { key: 'burnable', label: 'Burnable' },
                  { key: 'pausable', label: 'Pausable' },
                  { key: 'blacklist', label: 'Blacklist' },
                  { key: 'antiBot', label: 'Anti-Bot' }
                ].map(({ key, label }) => (
                  <span
                    key={key}
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      formData[key as keyof TokenFormValues]
                        ? 'bg-primary/20 text-primary'
                        : 'bg-white/5 text-white/50'
                    }`}
                  >
                    {label}: {formData[key as keyof TokenFormValues] ? 'On' : 'Off'}
                  </span>
                ))}
              </div>
            </div>

            {/* Transaction Limits */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-white/50 text-sm font-medium mb-1.5">Transaction Limits</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span className="text-white/50">Max Transaction:</span>
                <span className="text-white">{formData.maxTx ? 'Enabled' : 'Disabled'}</span>
                <span className="text-white/50">Max Amount:</span>
                <span className="text-white">{formData.maxTxAmount} {formData.symbol}</span>
              </div>
            </div>

            {/* Taxes */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-white/50 text-sm font-medium mb-1.5">Taxes</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span className="text-white/50">Transfer Tax:</span>
                <span className="text-white">{formData.transferTax}%</span>
              </div>
            </div>

            {/* Security Settings */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-white/50 text-sm font-medium mb-1.5">Security Settings</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span className="text-white/50">Anti-Bot:</span>
                <span className="text-white">{formData.antiBot ? 'Enabled' : 'Disabled'}</span>
                <span className="text-white/50">Cooldown:</span>
                <span className="text-white">{formData.cooldownTime}s</span>
              </div>
            </div>
          </div>

          <div className="text-white/70 text-xs">
            Please review the details carefully before proceeding. This action cannot be undone.
          </div>
        </div>

        <AlertDialogFooter className="mt-4 flex gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-10"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-primary hover:bg-primary/90 text-white h-10"
          >
            Create Token
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 