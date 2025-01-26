import { useEffect } from 'react'

interface WebSocketMessage {
  type: string
  config?: any
  message?: string
  chatId?: string
}

export function useWebSocket(sessionId: string, onConfigUpdate: (config: any) => void) {
  useEffect(() => {
    if (!sessionId) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected with url:', wsUrl)
      console.log('Session ID:', sessionId)
    }

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        
        // Sadece bu session'a ait config güncellemelerini işle
        if (data.type === 'configUpdated' && data.chatId === sessionId && data.config) {
          console.log('Received config update for session:', sessionId)
          onConfigUpdate(data.config)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [sessionId, onConfigUpdate])
} 