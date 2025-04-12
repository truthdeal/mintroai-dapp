"use client"

import * as React from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { TokenFormValues } from "./token-creation-form"

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
      <AlertDialogContent className="bg-black/90 border-white/10 backdrop-blur-xl text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Confirm Token Creation
          </AlertDialogTitle>
          <div className="text-white/70 space-y-4">
            <AlertDialogDescription>
              You are about to create a new token with the following parameters:
            </AlertDialogDescription>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-4">
              {/* Basic Details */}
              <div>
                <div className="text-white/50 mb-2 font-medium">Basic Details</div>
                <div className="grid grid-cols-2 gap-2">
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
              <div className="pt-4 border-t border-white/10">
                <div className="text-white/50 mb-2 font-medium">Features</div>
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
                      className={`px-2 py-1 rounded-full text-sm ${
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
              <div className="pt-4 border-t border-white/10">
                <div className="text-white/50 mb-2 font-medium">Transaction Limits</div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-white/50">Max Transaction:</span>
                  <span className="text-white">{formData.maxTx ? 'Enabled' : 'Disabled'}</span>
                  <span className="text-white/50">Max Transaction Amount:</span>
                  <span className="text-white">{formData.maxTxAmount} {formData.symbol}</span>
                </div>
              </div>

              {/* Taxes */}
              <div className="pt-4 border-t border-white/10">
                <div className="text-white/50 mb-2 font-medium">Taxes</div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-white/50">Transfer Tax:</span>
                  <span className="text-white">{formData.transferTax}%</span>
                </div>
              </div>

              {/* Security Settings */}
              <div className="pt-4 border-t border-white/10">
                <div className="text-white/50 mb-2 font-medium">Security Settings</div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-white/50">Anti-Bot Protection:</span>
                  <span className="text-white">{formData.antiBot ? 'Enabled' : 'Disabled'}</span>
                  <span className="text-white/50">Cooldown Time:</span>
                  <span className="text-white">{formData.cooldownTime} seconds</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-white/70">
              Please review the details carefully before proceeding. This action cannot be undone.
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Create Token
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 