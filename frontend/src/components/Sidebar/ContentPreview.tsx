import { useState, useEffect } from 'react'
import { useAgentStore } from '../../store/agentStore'
import { Ideia, Hook } from '../../types/agent'

// ---- Tipos ---------------------------------------------------------------

interface SessionItem {
  ciclo_id: string
  ideias_count: number
  ideias: Ideia[]
}

// ---- Hook Card -----------------------------------------------------------

function HookCard({ hook }: { hook: Hook }) {
  return (
    <div className="border border-war-border rounded p-2 space-y-1 bg-war-bg">
      <div className="flex items-center gap-2">
        <span className="font-pixel text-[6px] text-war-gold">V{hook.variacao}</span>
        <span className="font-mono text-[9px] text-gray-400 truncate">{hook.estrategia}</span>
      </div>
      <p className="font-mono text-[10px] text-white leading-snug">"{hook.falado}"</p>
      <p className="font-mono text-[10px] leading-snug" style={{ color: '#4a7898' }}>{hook.titulo}</p>
      {hook.subtitulo && (
        <p className="font-mono text-[9px] text-gray-400 leading-snug">{hook.subtitulo}</p>
      )}
    </div>
  )
}

// ---- Detalhe de ideia ---------------------------------------------------

function IdeiaDetail({ ideia, onBack }: { ideia: Ideia; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-war-border flex items-center gap-2">
        <button
          onClick={onBack}
          className="font-pixel text-[7px] text-gray-400 hover:text-white transition-colors"
        >
          ← VOLTAR
        </button>
        <span className="font-pixel text-[7px] text-war-gold ml-auto">IDEIA</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <p className="font-pixel text-[8px] text-white leading-relaxed">{ideia.topico}</p>

        {ideia.tese && (
          <div className="space-y-1">
            <span className="font-pixel text-[6px] text-gray-500">TESE</span>
            <p className="font-mono text-[10px] text-gray-300 leading-snug">{ideia.tese}</p>
          </div>
        )}

        {ideia.angulo && (
          <div className="rounded p-2 space-y-1" style={{ background: '#0a1a10', border: '1px solid #1a3820' }}>
            <span className="font-pixel text-[6px]" style={{ color: '#3a7050' }}>ÂNGULO</span>
            <p className="font-mono text-[10px] leading-snug" style={{ color: '#6a9878' }}>{ideia.angulo}</p>
          </div>
        )}

        {ideia.frase_posicionamento && (
          <p className="font-mono text-[10px] italic leading-snug" style={{ color: '#6a5888' }}>
            "{ideia.frase_posicionamento}"
          </p>
        )}

        {ideia.contexto && (
          <div className="space-y-1">
            <span className="font-pixel text-[6px] text-gray-500">CONTEXTO</span>
            <p className="font-mono text-[10px] text-gray-400 leading-snug">{ideia.contexto}</p>
          </div>
        )}

        {ideia.links && ideia.links.length > 0 && (
          <div className="space-y-1">
            <span className="font-pixel text-[6px] text-gray-500">FONTES</span>
            <div className="flex flex-col gap-1">
              {ideia.links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] underline truncate"
                  style={{ color: '#3a6888' }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {ideia.hooks && ideia.hooks.length > 0 && (
          <div className="space-y-2">
            <span className="font-pixel text-[6px]" style={{ color: '#7a3828' }}>HOOKS ({ideia.hooks.length})</span>
            {ideia.hooks.map((h, i) => (
              <HookCard key={i} hook={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Card de ideia na lista ----------------------------------------------

function IdeiaListCard({
  ideia,
  index,
  onClick,
}: {
  ideia: Ideia
  index: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-war-border rounded-lg p-3 space-y-2 hover:border-war-gold/50 hover:bg-war-bg/60 transition-all group"
    >
      <div className="flex items-start gap-2">
        <span className="font-pixel text-[8px] text-war-gold shrink-0">#{index + 1}</span>
        <p className="font-pixel text-[7px] text-white leading-relaxed">{ideia.topico}</p>
        <span className="font-pixel text-[6px] text-gray-600 group-hover:text-gray-400 shrink-0 ml-auto transition-colors">
          →
        </span>
      </div>

      {ideia.angulo && (
        <p className="font-mono text-[9px] leading-snug line-clamp-2" style={{ color: '#4a7860' }}>
          {ideia.angulo}
        </p>
      )}

      {ideia.hooks && ideia.hooks.length > 0 && (
        <span className="inline-block font-pixel text-[6px] rounded px-1 py-0.5" style={{ color: '#7a3828', border: '1px solid #3a1810' }}>
          {ideia.hooks.length} hooks
        </span>
      )}
    </button>
  )
}

// ---- Output atual -------------------------------------------------------

function CurrentOutput({
  ideias,
  onOpenHistory,
}: {
  ideias: Ideia[]
  onOpenHistory: () => void
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (selectedIndex !== null) {
    return (
      <IdeiaDetail
        ideia={ideias[selectedIndex]}
        onBack={() => setSelectedIndex(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-war-border flex items-center gap-2">
        <span className="font-pixel text-[8px] text-war-gold tracking-wider">OUTPUT</span>
        <span className="font-mono text-[10px] ml-auto" style={{ color: '#3a7050' }}>
          {ideias.length} ideias
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {ideias.map((ideia, i) => (
          <IdeiaListCard
            key={i}
            ideia={ideia}
            index={i}
            onClick={() => setSelectedIndex(i)}
          />
        ))}
        {/* Botão para ver histórico no fim da lista */}
        <button
          onClick={onOpenHistory}
          className="w-full py-2 mt-1 font-pixel text-[6px] text-gray-600 hover:text-war-gold border border-war-border/40 hover:border-war-gold/40 rounded transition-all"
        >
          VER GERAÇÕES ANTERIORES →
        </button>
      </div>
    </div>
  )
}

// ---- Lista de ideias de uma geração do histórico -------------------------

function HistorySessionIdeias({
  session,
  onBack,
}: {
  session: SessionItem
  onBack: () => void
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (selectedIndex !== null) {
    return (
      <IdeiaDetail
        ideia={session.ideias[selectedIndex]}
        onBack={() => setSelectedIndex(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-war-border flex items-center gap-2">
        <button
          onClick={onBack}
          className="font-pixel text-[7px] text-gray-400 hover:text-white transition-colors"
        >
          ← GERAÇÕES
        </button>
        <span className="font-mono text-[10px] ml-auto" style={{ color: '#3a7050' }}>
          {session.ideias.length} ideias
        </span>
      </div>
      <div className="px-3 py-1 border-b border-war-border/50">
        <span className="font-mono text-[8px] text-gray-600">{_formatCicloId(session.ciclo_id)}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {session.ideias.map((ideia, i) => (
          <IdeiaListCard
            key={i}
            ideia={ideia}
            index={i}
            onClick={() => setSelectedIndex(i)}
          />
        ))}
      </div>
    </div>
  )
}

// ---- Lista de gerações (histórico) --------------------------------------

function HistoryList({
  onBack,
  onSelect,
}: {
  onBack: () => void
  onSelect: (session: SessionItem) => void
}) {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/cycles')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SessionItem[]) => {
        setSessions(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-war-border flex items-center gap-2">
        <button
          onClick={onBack}
          className="font-pixel text-[7px] text-gray-400 hover:text-white transition-colors"
        >
          ← OUTPUT
        </button>
        <span className="font-pixel text-[8px] text-war-gold ml-auto tracking-wider">GERAÇÕES</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {loading && (
          <p className="font-mono text-[10px] text-gray-600 text-center py-4">carregando...</p>
        )}
        {!loading && sessions.length === 0 && (
          <p className="font-mono text-[10px] text-gray-600 text-center py-4">
            nenhuma geração encontrada
          </p>
        )}
        {sessions.map((session, i) => (
          <button
            key={session.ciclo_id}
            onClick={() => onSelect(session)}
            className="w-full text-left border border-war-border rounded-lg p-3 space-y-1 hover:border-war-gold/50 hover:bg-war-bg/60 transition-all group"
          >
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[7px] text-war-gold shrink-0">
                {i === 0 ? 'ÚLTIMO' : `#${sessions.length - i}`}
              </span>
              <span className="font-mono text-[9px] text-gray-300">
                {_formatCicloId(session.ciclo_id)}
              </span>
              <span className="font-pixel text-[6px] text-gray-600 group-hover:text-gray-400 ml-auto transition-colors">
                →
              </span>
            </div>
            <span className="font-pixel text-[6px]" style={{ color: '#3a6848' }}>
              {session.ideias_count} ideias
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- Helpers -------------------------------------------------------------

function _formatCicloId(cicloId: string): string {
  const m = cicloId.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/)
  if (!m) return cicloId
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`
}

// ---- Componente principal ------------------------------------------------

type View = 'output' | 'history' | 'history-session'

export function ContentPreview() {
  const content = useAgentStore((s) => s.cycle.latestContent)
  const [view, setView] = useState<View>('output')
  const [historySession, setHistorySession] = useState<SessionItem | null>(null)

  if (view === 'history') {
    return (
      <HistoryList
        onBack={() => setView('output')}
        onSelect={(s) => {
          setHistorySession(s)
          setView('history-session')
        }}
      />
    )
  }

  if (view === 'history-session' && historySession) {
    return (
      <HistorySessionIdeias
        session={historySession}
        onBack={() => setView('history')}
      />
    )
  }

  // Output atual vazio
  if (!content || !content.ideias || content.ideias.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 border-b border-war-border flex items-center gap-2">
          <span className="font-pixel text-[8px] text-war-gold tracking-wider">OUTPUT</span>
          <button
            onClick={() => setView('history')}
            className="font-pixel text-[6px] text-gray-500 hover:text-war-gold transition-colors ml-auto"
          >
            GERAÇÕES →
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-xs text-gray-600 text-center">
            conteúdo aparece aqui<br />após o ciclo finalizar
          </p>
        </div>
      </div>
    )
  }

  return (
    <CurrentOutput
      ideias={content.ideias}
      onOpenHistory={() => setView('history')}
    />
  )
}
