import { useAgentStore } from '../store/agentStore'
import { AGENT_CONFIG, AGENT_IDS } from '../types/agent'

const STATUS_COLORS: Record<string, string> = {
  idle:      'text-gray-600',
  thinking:  'text-yellow-400',
  working:   'text-blue-400',
  completed: 'text-green-400',
  error:     'text-red-400',
}

const STATUS_DOT: Record<string, string> = {
  idle:      'bg-gray-700',
  thinking:  'bg-yellow-400 animate-pulse',
  working:   'bg-blue-400 animate-pulse',
  completed: 'bg-green-400',
  error:     'bg-red-500',
}

export function StatusBar() {
  const agents = useAgentStore((s) => s.agents)
  const cycle = useAgentStore((s) => s.cycle)

  return (
    <div className="h-10 bg-war-panel border-t border-war-border flex items-center px-4 gap-6 shrink-0">
      {/* Fase atual */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-pixel text-[6px] text-war-gold shrink-0">FASE</span>
        <span className="font-mono text-[10px] text-gray-300 truncate">
          {cycle.running ? cycle.faseLabel : 'idle'}
        </span>
      </div>

      <div className="w-px h-4 bg-war-border shrink-0" />

      {/* Status dos agentes */}
      <div className="flex items-center gap-4 overflow-x-auto">
        {AGENT_IDS.map((id) => {
          const cfg = AGENT_CONFIG[id]
          const state = agents[id]
          const status = state?.status ?? 'idle'
          return (
            <div key={id} className="flex items-center gap-1.5 shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
              <span
                className={`font-pixel text-[6px] ${STATUS_COLORS[status]}`}
                style={status !== 'idle' ? { color: cfg?.color } : undefined}
              >
                {cfg?.persona ?? id}
              </span>
            </div>
          )
        })}
      </div>

      {/* Ciclo ID */}
      {cycle.cicloId && (
        <>
          <div className="w-px h-4 bg-war-border shrink-0 ml-auto" />
          <span className="font-mono text-[9px] text-gray-600 shrink-0">
            #{cycle.cicloId}
          </span>
        </>
      )}
    </div>
  )
}
