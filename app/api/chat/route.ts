import { NextResponse } from 'next/server'

if (!process.env.NEXT_PUBLIC_CHAT_URL) {
  throw new Error('NEXT_PUBLIC_CHAT_URL is not defined in environment variables')
}

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, chatInput } = body

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        action: 'sendMessage',
        chatInput,
      }),
    })

    const data = await response.json()
    console.log(data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
} 