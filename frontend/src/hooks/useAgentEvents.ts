import { useEffect, useRef } from 'react'
import { useAgentStore } from '../store/agentStore'
import { AgentEvent } from '../types/agent'

const WS_URL = 'ws://localhost:8000/ws'
const RECONNECT_DELAY = 3000

export function useAgentEvents() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const processEvent = useAgentStore((s) => s.processEvent)
  const setWsConnected = useAgentStore((s) => s.setWsConnected)

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
        // Restaura o último output se a página foi recarregada
        fetch('/cycle/latest')
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data?.ideias && Array.isArray(data.ideias) && data.ideias.length > 0) {
              processEvent({
                agente: 'sistema',
                tipo: 'content_ready',
                mensagem: 'Conteúdo restaurado',
                dados: { ideias: data.ideias },
              })
            }
          })
          .catch(() => {})
      }

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as AgentEvent
          processEvent(event)
        } catch {
          // pong ou mensagem não-JSON
        }
      }

      ws.onclose = () => {
        setWsConnected(false)
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send('ping')
    }, 25000)

    return () => {
      clearInterval(ping)
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [processEvent, setWsConnected])
}
