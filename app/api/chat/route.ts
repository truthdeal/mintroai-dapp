import { NextRequest, NextResponse } from 'next/server'

if (!process.env.NEXT_PUBLIC_CHAT_URL) {
  throw new Error('NEXT_PUBLIC_CHAT_URL is not defined in environment variables')
}
if (!process.env.NEXT_PUBLIC_CHAT_URL_GENERAL) {
  throw new Error('NEXT_PUBLIC_CHAT_URL_GENERAL is not defined in environment variables')
}
if (!process.env.NEXT_PUBLIC_CHAT_URL_VESTING) {
  throw new Error('NEXT_PUBLIC_CHAT_URL_VESTING is not defined in environment variables')
}

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL
const CHAT_URL_GENERAL = process.env.NEXT_PUBLIC_CHAT_URL_GENERAL
const CHAT_URL_VESTING = process.env.NEXT_PUBLIC_CHAT_URL_VESTING

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const maxDuration = 80 // Maximum duration as seconds

export async function POST(req: NextRequest) {
    try {
    const { sessionId, chatInput, mode } = await req.json()

    // Mode'a göre timeout süresini belirle
    const timeoutDuration = mode === 'general' ? 75000 : 25000 // 75 saniye vs 25 saniye

    // Timeout kontrolü için Promise.race kullanımı
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutDuration)
    })

    let fetchPromise: Promise<Response>
    if (mode === 'general') {
      fetchPromise = fetch(`${CHAT_URL_GENERAL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          chatInput,
          mode
        }),
      })
    } else if (mode === 'token') {
      // Token Creation için mevcut endpoint ve body
      fetchPromise = fetch(`${CHAT_URL}/${sessionId}`, {
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
    } else if (mode === 'vesting') {
      fetchPromise = fetch(`${CHAT_URL_VESTING}/${sessionId}`, {
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
    } else {
      throw new Error('Invalid mode');
    }

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: 'Invalid response from ChainGPT', raw: text };
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Chat error:', error)
    

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