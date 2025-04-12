import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.CONTRACT_GENERATOR_URL}/api/compile-contract/${chatId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Contract compilation failed');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error in contract compilation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to compile contract';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 