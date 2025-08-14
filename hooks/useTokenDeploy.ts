import { useWriteContract, useChainId, useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { SUPPORTED_NETWORKS } from '@/config/networks'
import { FACTORY_ABI } from '@/config/factory-abi'
import { toast } from 'sonner'
import { requiresBigBlocks, HYPERLIQUID_CHAINS } from '@/lib/hyperliquid'

export function useTokenDeploy() {
  const chainId = useChainId()
  const { address } = useAccount()
  const { writeContract: deployToken, isPending, data: hash } = useWriteContract()
  const { 
    isLoading: isWaiting, 
    isSuccess, 
    error,
    data: receipt // Transaction receipt - içinde deployedAddress var
  } = useWaitForTransactionReceipt({
    hash,
  })

  const isHyperliquid = chainId === HYPERLIQUID_CHAINS.mainnet || chainId === HYPERLIQUID_CHAINS.testnet

  const deploy = async (bytecode: string) => {
    if (!chainId) throw new Error('No chain selected')
    if (!address) throw new Error('Wallet not connected')
    if (!SUPPORTED_NETWORKS[chainId]) throw new Error('Chain not supported')

    // For Hyperliquid, handle big blocks if needed
    if (isHyperliquid) {
      const needsBigBlocks = requiresBigBlocks(bytecode)
      
      if (needsBigBlocks) {
        toast.info('Large contract detected. Using Hyperliquid big blocks...')
        toast.warning('Deployment may take up to 1 minute with big blocks.')
        
        // Use bigBlockGasPrice instead of regular gasPrice for big blocks
        // This is simpler than trying to switch the user's block mode
        deployToken({
          address: SUPPORTED_NETWORKS[chainId].factoryAddress,
          abi: FACTORY_ABI,
          functionName: 'deployBytecode',
          args: [`0x${bytecode}` as `0x${string}`],
          gas: BigInt(4000000), // 4M gas limit for big blocks
          // @ts-ignore - bigBlockGasPrice is a Hyperliquid-specific parameter
          bigBlockGasPrice: BigInt(1000000000) // 1 gwei for big blocks
        })
      } else {
        // Small contract, use regular blocks
        deployToken({
          address: SUPPORTED_NETWORKS[chainId].factoryAddress,
          abi: FACTORY_ABI,
          functionName: 'deployBytecode',
          args: [`0x${bytecode}` as `0x${string}`],
          gas: BigInt(1900000),
          gasPrice: BigInt(1000000000) // 1 gwei for small blocks
        })
      }
    } else {
      // Non-Hyperliquid chain, use normal deployment
      deployToken({
        address: SUPPORTED_NETWORKS[chainId].factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'deployBytecode',
        args: [`0x${bytecode}` as `0x${string}`],
        gas: BigInt(3500000)
      })
    }
  }

  return { 
    deploy, 
    isPending, // MetaMask onayı beklerken
    isWaiting, // Transaction mine edilmeyi beklerken
    isSuccess,  // Transaction başarıyla mine edildiğinde
    error,
    hash, // Transaction hash
    receipt // Transaction receipt - içinde logs, events ve diğer bilgiler var
  }
} 