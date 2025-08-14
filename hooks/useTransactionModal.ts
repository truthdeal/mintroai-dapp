import { useState, useCallback } from 'react'
import { TransactionStatus } from '@/components/vesting/transaction-modal'

interface TransactionModalState {
  isOpen: boolean
  status: TransactionStatus
  title?: string
  description?: string
  errorMessage?: string
  txHash?: string
}

export function useTransactionModal() {
  const [modalState, setModalState] = useState<TransactionModalState>({
    isOpen: false,
    status: 'idle',
    title: undefined,
    description: undefined,
    errorMessage: undefined,
    txHash: undefined
  })

  const openModal = useCallback((
    title?: string,
    description?: string
  ) => {
    setModalState({
      isOpen: true,
      status: 'signing',
      title,
      description,
      errorMessage: undefined,
      txHash: undefined
    })
  }, [])

  const updateStatus = useCallback((
    status: TransactionStatus,
    updates?: {
      title?: string
      description?: string
      errorMessage?: string
      txHash?: string
    }
  ) => {
    setModalState(prev => ({
      ...prev,
      status,
      ...updates
    }))
  }, [])

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }))
  }, [])

  const resetModal = useCallback(() => {
    setModalState({
      isOpen: false,
      status: 'idle',
      title: undefined,
      description: undefined,
      errorMessage: undefined,
      txHash: undefined
    })
  }, [])

  return {
    modalState,
    openModal,
    updateStatus,
    closeModal,
    resetModal
  }
}