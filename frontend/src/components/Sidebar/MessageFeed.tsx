import { useAgentStore } from '../../store/agentStore'
import { AGENT_CONFIG } from '../../types/agent'
import { PixelCharHead, PixelTypeIcon } from './PixelArt'

// Cores de texto para banners de sistema — alinhadas com a paleta do war room
const SISTEMA_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  cycle_start:   { bg: '#100a1c', border: '#281640', text: '#6040a0' },
  cycle_end:     { bg: '#0a1410', border: '#183028', text: '#3a7050' },
  phase_change:  { bg: '#14100a', border: '#302810', text: '#7a6820' },
  message_sent:  { bg: '#0a1418', border: '#182c38', text: '#2a6878' },
  content_ready: { bg: '#14100a', border: '#382010', text: '#885020' },
  connected:     { bg: '#0a1410', border: '#183028', text: '#3a6848' },
  error:         { bg: '#140a0a', border: '#381010', text: '#882828' },
}
const SISTEMA_DEFAULT = { bg: '#0c1020', border: '#1a2a40', text: '#3a5070' }

function timeStr(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function MessageFeed() {
  const messages = useAgentStore((s) => s.messages)

  return (
    <div className="flex flex-col h-full overflow-y-auto px-2 py-2 space-y-1.5">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 gap-3">
          <PixelTypeIcon tipo="signal" px={3} />
          <span className="font-mono text-[10px]" style={{ color: '#283848' }}>
            aguardando ciclo...
          </span>
        </div>
      )}

      {messages.map((msg) => {
        const cfg = AGENT_CONFIG[msg.agente]
        const agentColor = cfg?.color ?? '#4a5a70'
        const isSistema = msg.agente === 'sistema'

        // ── Banner de sistema ──────────────────────────────────────────────
        if (isSistema) {
          const s = SISTEMA_STYLE[msg.tipo] ?? SISTEMA_DEFAULT
          return (
            <div
              key={msg.id}
              className="animate-slide-in flex items-center gap-2 py-1.5 px-2.5 rounded"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <PixelTypeIcon tipo={msg.tipo} px={2} />
              <p
                className="font-pixel text-[6px] flex-1 leading-tight"
                style={{ color: s.text }}
              >
                {msg.mensagem}
              </p>
              <span
                className="font-mono text-[8px] shrink-0"
                style={{ color: '#283040' }}
              >
                {timeStr(msg.timestamp)}
              </span>
            </div>
          )
        }

        // ── Card do agente ─────────────────────────────────────────────────
        return (
          <div
            key={msg.id}
            className="animate-slide-in flex gap-2 py-1.5 px-2 rounded"
            style={{
              borderLeft: `2px solid ${agentColor}30`,
              background: `${agentColor}07`,
            }}
          >
            {/* Avatar — rosto do agente em pixel art */}
            <div
              className="shrink-0 rounded mt-0.5 p-0.5"
              style={{
                border: `1px solid ${agentColor}25`,
                background: `${agentColor}10`,
              }}
            >
              <PixelCharHead agentId={msg.agente} px={2} rows={5} />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1 mb-0.5">
                <span
                  className="font-pixel text-[6px] shrink-0 leading-tight"
                  style={{ color: agentColor }}
                >
                  {cfg?.persona ?? msg.agente}
                </span>
                {cfg?.role && (
                  <span
                    className="font-mono text-[8px] shrink-0"
                    style={{ color: '#2a3850' }}
                  >
                    · {cfg.role}
                  </span>
                )}
                <span
                  className="font-mono text-[8px] ml-auto shrink-0"
                  style={{ color: '#2a3850' }}
                >
                  {timeStr(msg.timestamp)}
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <div className="mt-[2px]">
                  <PixelTypeIcon tipo={msg.tipo} px={2} />
                </div>
                <p
                  className="font-mono text-[10px] leading-tight"
                  style={{ color: '#7a8898', wordBreak: 'break-word' }}
                >
                  {msg.mensagem}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
