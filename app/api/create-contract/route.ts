import { NextRequest, NextResponse } from 'next/server';

// Type for the contract data
interface ContractData {
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

export async function POST(request: NextRequest) {
  try {
    const contractData: ContractData = await request.json();

    // Make the request to your contract generator service
    const response = await fetch(`${process.env.NEXT_PUBLIC_CONTRACT_GENERATOR_URL}/api/generate-contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any additional headers like API keys if needed
        // 'Authorization': `Bearer ${process.env.API_KEY}`,
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
