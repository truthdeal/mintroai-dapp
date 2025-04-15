import { useWriteContract, useChainId, useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { SUPPORTED_NETWORKS } from '@/config/networks'
import { FACTORY_ABI } from '@/config/factory-abi'

export function useTokenDeploy() {
  const chainId = useChainId()
  const { address } = useAccount()
  const { writeContract: deployToken, isPending, data: hash } = useWriteContract()
  const { isLoading: isWaiting, isSuccess, error } = useWaitForTransactionReceipt({
    hash,
  })

  const deploy = async (bytecode: string) => {
    if (!chainId) throw new Error('No chain selected')
    if (!address) throw new Error('Wallet not connected')
    if (!SUPPORTED_NETWORKS[chainId]) throw new Error('Chain not supported')

    await deployToken({
      address: SUPPORTED_NETWORKS[chainId].factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'deployBytecode',
      args: [`0x${bytecode}` as `0x${string}`],
      gas: BigInt(2000000)
    })
  }

  return { 
    deploy, 
    isPending, // MetaMask onayı beklerken
    isWaiting, // Transaction mine edilmeyi beklerken
    isSuccess,  // Transaction başarıyla mine edildiğinde
    error,
    hash // Transaction hash
  }
} 