import { useState, useEffect } from 'react'
import { MessageFeed } from './MessageFeed'
import { ContentPreview } from './ContentPreview'
import { useAgentStore } from '../../store/agentStore'
import { AGENT_CONFIG, AGENT_IDS } from '../../types/agent'
import { PixelCharHead, PixelStatusDot } from './PixelArt'

type Tab = 'ops' | 'output'

// ── Faixa com os agentes e seu status ───────────────────────────────────────
function AgentStatusStrip() {
  const agents = useAgentStore((s) => s.agents)

  return (
    <div
      className="flex px-3 py-2 border-b border-war-border"
      style={{ background: 'rgba(8, 12, 24, 0.6)' }}
    >
      {AGENT_IDS.map((id) => {
        const cfg = AGENT_CONFIG[id]
        const state = agents[id]
        const isActive = state?.status === 'thinking' || state?.status === 'working'
        const isDone = state?.status === 'completed'
        const isError = state?.status === 'error'

        // Indicador de status debaixo do avatar (linha colorida)
        const indicatorColor = isError
          ? '#7a2020'
          : isActive
            ? cfg.color
            : isDone
              ? cfg.color + '80'
              : '#1a2a3a'

        return (
          <div
            key={id}
            className="flex flex-col items-center gap-1 flex-1"
            title={`${cfg.persona} — ${state?.status ?? 'idle'}`}
          >
            {/* Container do avatar */}
            <div
              className="rounded p-1 transition-all duration-400"
              style={{
                background: isActive
                  ? `${cfg.color}18`
                  : `${cfg.color}08`,
                border: `1px solid ${cfg.color}${isActive ? '45' : '18'}`,
                // Glow sutil quando ativo — sem neon
                boxShadow: isActive
                  ? `0 0 8px ${cfg.color}28`
                  : 'none',
              }}
            >
              <PixelCharHead agentId={id} px={3} rows={5} />
            </div>

            {/* Nome abreviado */}
            <span
              className="font-pixel text-[5px] text-center leading-tight"
              style={{ color: isActive ? cfg.color : '#283848' }}
            >
              {cfg.persona.split(' ')[0].slice(0, 5).toUpperCase()}
            </span>

            {/* Linha indicadora de status */}
            <div
              className="w-full rounded-full transition-all duration-300"
              style={{
                height: '2px',
                background: indicatorColor,
                opacity: isActive ? 1 : 0.4,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Estilos inline dos botões — alinhados com a paleta do war room ───────────
// Evita classes Tailwind com cores genéricas (yellow, blue, red) que não combinam.

const BTN_STYLE = {
  running: {
    background: '#14110a',
    border: '1px solid #3a3010',
    color: '#7a6828',
    cursor: 'not-allowed' as const,
  },
  loading: {
    background: '#0a0f1e',
    border: '1px solid #1a2848',
    color: '#3a5878',
    cursor: 'not-allowed' as const,
  },
  ready: {
    background: '#180a08',
    border: '1px solid #401818',
    color: '#8a4038',
    cursor: 'pointer' as const,
  },
  offline: {
    background: '#0a0c18',
    border: '1px solid #181e30',
    color: '#303848',
    cursor: 'not-allowed' as const,
  },
}

export function Sidebar() {
  const [tab, setTab] = useState<Tab>('ops')
  const [loading, setLoading] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const running = useAgentStore((s) => s.cycle.running)
  const wsConnected = useAgentStore((s) => s.wsConnected)
  const latestContent = useAgentStore((s) => s.cycle.latestContent)
  const faseLabel = useAgentStore((s) => s.cycle.faseLabel)

  useEffect(() => {
    if (running || !wsConnected) setLoading(false)
  }, [running, wsConnected])

  async function startCycle() {
    setStartError(null)
    setLoading(true)
    try {
      const res = await fetch('/cycle/start', { method: 'POST' })
      if (!res.ok) throw new Error(`Servidor retornou ${res.status}`)
      const data = await res.json()
      if (data.status === 'already_running') setLoading(false)
    } catch (err) {
      setLoading(false)
      setStartError(err instanceof Error ? err.message : 'Erro ao iniciar ciclo')
    }
  }

  async function cancelCycle() {
    await fetch('/cycle/cancel', { method: 'POST' }).catch(() => {})
  }

  const btnStyle = running
    ? BTN_STYLE.running
    : loading
      ? BTN_STYLE.loading
      : wsConnected
        ? BTN_STYLE.ready
        : BTN_STYLE.offline

  const btnLabel = running
    ? 'CICLO RODANDO...'
    : loading
      ? 'INICIANDO...'
      : 'INICIAR CICLO'

  return (
    <div
      className="w-72 flex flex-col bg-war-panel border-l border-war-border h-full"
      style={{ boxShadow: 'inset 3px 0 24px rgba(212, 170, 48, 0.04), -1px 0 0 #0a0e1a' }}
    >
      {/* Header */}
      <div
        className="px-3 pt-3 pb-2.5 border-b border-war-border space-y-2"
        style={{ background: 'rgba(8, 12, 24, 0.4)' }}
      >
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[9px] text-war-gold tracking-wider">
            CENTRAL OPS
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px]" style={{ color: '#2a3a50' }}>
              {wsConnected ? 'online' : 'offline'}
            </span>
            <PixelStatusDot online={wsConnected} px={2} />
          </div>
        </div>

        {/* Botão iniciar */}
        <button
          onClick={startCycle}
          disabled={loading || running || !wsConnected}
          className="w-full py-2 rounded font-pixel text-[8px] transition-all"
          style={btnStyle}
        >
          {btnLabel}
        </button>

        {/* Botão cancelar — só aparece quando rodando */}
        {running && (
          <button
            onClick={cancelCycle}
            className="w-full py-1.5 rounded font-pixel text-[7px] transition-all"
            style={{
              background: 'transparent',
              border: '1px solid #2a1a1a',
              color: '#503030',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#8a4040'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#5a2020'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#503030'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2a1a1a'
            }}
          >
            CANCELAR CICLO
          </button>
        )}

        {/* Fase atual */}
        {running && faseLabel && faseLabel !== 'Aguardando...' && (
          <p
            className="font-mono text-[9px] text-center truncate animate-blink"
            style={{ color: '#2a4060' }}
            title={faseLabel}
          >
            {faseLabel}
          </p>
        )}

        {/* Erro */}
        {startError && (
          <p
            className="font-mono text-[9px] text-center truncate"
            style={{ color: '#7a3030' }}
            title={startError}
          >
            {startError}
          </p>
        )}
      </div>

      {/* Faixa de status dos agentes */}
      <AgentStatusStrip />

      {/* Tabs */}
      <div className="flex border-b border-war-border">
        {([['ops', 'OPS'], ['output', `OUTPUT${latestContent ? ' +' : ''}`]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 font-pixel text-[7px] transition-colors
              ${tab === t
                ? 'text-war-gold border-b-2 border-war-gold bg-war-bg/30'
                : 'text-gray-600 hover:text-gray-400'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo da tab */}
      <div className="flex-1 overflow-hidden">
        {tab === 'ops' ? <MessageFeed /> : <ContentPreview />}
      </div>
    </div>
  )
}
