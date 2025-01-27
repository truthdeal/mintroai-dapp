import { useEffect, useRef } from 'react'

type ConfigUpdateCallback = (config: any) => void

// Global WebSocket instance
let globalWs: WebSocket | null = null
let globalSessionId: string | null = null

export function useWebSocket(
  sessionId: string,
  isInitialized: boolean,
  onConfigUpdate: ConfigUpdateCallback
) {
  // `onConfigUpdate` callback'ini ref ile saralım
  const onConfigUpdateRef = useRef(onConfigUpdate)
  onConfigUpdateRef.current = onConfigUpdate

  useEffect(() => {
    if (!sessionId || !isInitialized) return

    // Eğer aynı session için bağlantı zaten varsa, yeni bağlantı kurma
    if (globalSessionId === sessionId && globalWs?.readyState === WebSocket.OPEN) {
      return
    }

    // Eğer farklı bir session için bağlantı varsa kapat
    if (globalWs?.readyState === WebSocket.OPEN) {
      globalWs.close()
      globalWs = null
    }

    // WebSocket URL'ini environment variable'dan al
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    if (!wsUrl) {
      console.error('WebSocket URL is not defined')
      return
    }

    // Yeni bağlantı kur
    globalSessionId = sessionId
    const ws = new WebSocket(`${wsUrl}?sessionId=${sessionId}`)
    globalWs = ws

    ws.onopen = () => {
      console.log('WebSocket connected for session:', sessionId)
    }

    ws.onmessage = (event) => {
      console.log('Raw WebSocket message received:', event.data)
      try {
        const data = JSON.parse(event.data)
        console.log('Parsed WebSocket data:', data)
        if (data.type === 'configUpdated' && data.chatId === sessionId) {
          console.log('Config update for current session:', data.config)
          onConfigUpdateRef.current(data.config)
        } else {
          console.log('Message ignored - type or sessionId mismatch:', {
            type: data.type,
            messageChatId: data.chatId,
            currentSessionId: sessionId
          })
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error for session:', sessionId, error)
      if (globalSessionId === sessionId) {
        globalWs = null
        globalSessionId = null
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected for session:', sessionId)
      if (globalSessionId === sessionId) {
        globalWs = null
        globalSessionId = null
      }
    }

    // Cleanup function
    return () => {
      // Component unmount olduğunda bağlantıyı kapatma
      if (globalWs?.readyState === WebSocket.OPEN) {
        globalWs.close()
        globalWs = null
        globalSessionId = null
      }
    }
  }, [sessionId, isInitialized])
} 