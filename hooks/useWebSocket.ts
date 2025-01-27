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
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'configUpdated' && data.sessionId === sessionId) {
          onConfigUpdate(data.config)
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
      // Strict Mode'da gereksiz yere bağlantı kapatıp açmayı önler
      if (document.visibilityState === 'hidden' && globalWs?.readyState === WebSocket.OPEN) {
        globalWs.close()
        globalWs = null
        globalSessionId = null
      }
    }
  }, [sessionId, isInitialized])

  // onConfigUpdate değiştiğinde mesaj handler'ını güncelle
  useEffect(() => {
    if (globalWs && globalSessionId === sessionId) {
      globalWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'configUpdated' && data.sessionId === sessionId) {
            onConfigUpdate(data.config)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
    }
  }, [onConfigUpdate, sessionId])
} 