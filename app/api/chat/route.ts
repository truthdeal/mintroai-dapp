import { NextRequest, NextResponse } from 'next/server'

if (!process.env.NEXT_PUBLIC_CHAT_URL) {
  throw new Error('NEXT_PUBLIC_CHAT_URL is not defined in environment variables')
}

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const maxDuration = 30 // saniye cinsinden maksimum süre

export async function POST(req: NextRequest) {
    try {
    const { sessionId, chatInput } = await req.json()

    // Timeout kontrolü için Promise.race kullanımı
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000) // 25 saniye
    })

    const fetchPromise = fetch(`${CHAT_URL}/${sessionId}`, {
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

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Chat error:', error)
    
    // Özel hata mesajları
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'The request took too long to process. Please try again.' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your request. Please try again.' },
      { status: 500 }
    )
  }
} 