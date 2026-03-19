import { useEffect, useRef } from 'react'
import { useAgentStore } from '../../store/agentStore'
import { WarRoomCanvas } from './WarRoomCanvas'

export function WarRoom() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<WarRoomCanvas | null>(null)
  const processedMsgs = useRef<Set<string>>(new Set())

  const agents      = useAgentStore((s) => s.agents)
  const flyingMsgs  = useAgentStore((s) => s.flyingMessages)
  const running     = useAgentStore((s) => s.cycle.running)
  const wsConnected = useAgentStore((s) => s.wsConnected)

  // Mount canvas once
  useEffect(() => {
    if (!containerRef.current) return
    const canvas = new WarRoomCanvas()
    canvasRef.current = canvas
    canvas.init(containerRef.current)
    return () => {
      canvas.destroy()
      canvasRef.current = null
    }
  }, [])

  // Office mode: sleep / active
  useEffect(() => {
    canvasRef.current?.setOfficeMode(running ? 'active' : 'sleep')
  }, [running])

  // Per-agent status updates
  useEffect(() => {
    Object.entries(agents).forEach(([id, state]) => {
      if (state?.status) canvasRef.current?.setAgentStatus(id, state.status)
    })
  }, [agents])

  // New flying messages → meeting walk animation
  useEffect(() => {
    flyingMsgs.forEach((fm) => {
      if (processedMsgs.current.has(fm.id)) return
      processedMsgs.current.add(fm.id)
      canvasRef.current?.triggerMeeting(fm.from, fm.to)
    })
  }, [flyingMsgs])

  return (
    <div className="flex-1 relative overflow-hidden" style={{ background: '#0a0e1a' }}>
      {/* Canvas container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Overlay: servidor offline */}
      {!wsConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm z-30">
          <div className="text-center space-y-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto animate-pulse" />
            <p className="font-pixel text-[8px] text-red-400">SERVIDOR OFFLINE</p>
            <p className="font-mono text-[10px] text-gray-500">python3 server.py</p>
          </div>
        </div>
      )}

      {/* Badge standby */}
      {wsConnected && !running && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div
            className="flex items-center gap-2 rounded px-3 py-1.5"
            style={{ background: '#0f1629cc', border: '1px solid #1e2d4a' }}
          >
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="font-pixel text-[5px] text-gray-500 tracking-wider">
              AGENTES EM STANDBY — CLIQUE EM INICIAR CICLO
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
