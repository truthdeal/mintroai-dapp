import { useWriteContract, useChainId, useAccount } from 'wagmi'
import { SUPPORTED_NETWORKS } from '@/config/networks'
import { FACTORY_ABI } from '@/config/factory-abi'

export function useTokenDeploy() {
  const chainId = useChainId()
  const { address } = useAccount()
  const { writeContract: deployToken, isPending, isSuccess, error } = useWriteContract()

  const deploy = async (bytecode: string) => {
    if (!chainId) throw new Error('No chain selected')
    if (!address) throw new Error('Wallet not connected')
    if (!SUPPORTED_NETWORKS[chainId]) throw new Error('Chain not supported')

    await deployToken({
      address: SUPPORTED_NETWORKS[chainId].factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'deployBytecode',
      args: [`0x${bytecode}` as `0x${string}`]
    })
  }

  return { deploy, isPending, isSuccess, error }
} 