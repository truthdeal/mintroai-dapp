import { NextRequest, NextResponse } from 'next/server'

if (!process.env.NEXT_PUBLIC_CHAT_URL) {
  throw new Error('NEXT_PUBLIC_CHAT_URL is not defined in environment variables')
}

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL
const CHAT_URL_GENERAL = process.env.NEXT_PUBLIC_CHAT_URL_GENERAL
const CHAT_URL_API_KEY = process.env.NEXT_PUBLIC_CHAT_URL_GENERAL_API_KEY

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const maxDuration = 30 // saniye cinsinden maksimum süre

export async function POST(req: NextRequest) {
    try {
    const { sessionId, chatInput, mode } = await req.json()

    // Timeout kontrolü için Promise.race kullanımı
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000) // 25 saniye
    })

    let fetchPromise: Promise<Response>
    if (mode === 'general') {
      fetchPromise = fetch(`${CHAT_URL_GENERAL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHAT_URL_API_KEY}`,
        },
        body: JSON.stringify({
          model: "general_assistant",
          question: chatInput,
          chatHistory: "off"
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

    // console data and mode
    console.log('Data:', data)
    console.log('Mode:', mode)

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