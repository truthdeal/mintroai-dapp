import { NextRequest, NextResponse } from 'next/server';

// Type for token contract data
interface TokenContractData {
  contractType: 'token';
  chatId: string;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  initialSupply: string;
  ownerAddress: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  blacklist: boolean;
  maxTx: boolean;
  maxTxAmount: number;
  transferTax: number;
  antiBot: boolean;
  cooldownTime: number;
}

// Type for vesting contract data
interface VestingContractData {
  contractType: 'hyperVesting';
  chatId: string;
  contractName: string;
  tokenAddress: string;
  tgeTimestamp: number;
  tgeRate: number;
  cliff: number;
  releaseRate: number;
  period: number;
  vestingSupply: number;
  decimals: number;
  ownerAddress: string;
  users: string[];
  amts: number[];
}

type ContractData = TokenContractData | VestingContractData;

export async function POST(request: NextRequest) {
  try {
    const contractData: ContractData = await request.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_CONTRACT_GENERATOR_URL}/api/generate-contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contractData),
    });

    if (!response.ok) {
      throw new Error('Contract generator service error');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error in contract generation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate contract';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
