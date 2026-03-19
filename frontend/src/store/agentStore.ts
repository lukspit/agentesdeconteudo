import { create } from 'zustand'
import {
  AgentId,
  AgentState,
  AgentEvent,
  Message,
  FlyingMessage,
  CycleState,
  AGENT_IDS,
} from '../types/agent'

interface Store {
  agents: Record<string, AgentState>
  messages: Message[]
  flyingMessages: FlyingMessage[]
  cycle: CycleState
  wsConnected: boolean
  processEvent: (event: AgentEvent) => void
  addFlyingMessage: (fm: FlyingMessage) => void
  removeFlyingMessage: (id: string) => void
  setWsConnected: (connected: boolean) => void
}

const initialAgentState = (): AgentState => ({
  status: 'idle',
  currentMessage: '',
  lastUpdated: Date.now(),
})

const initialCycle = (): CycleState => ({
  running: false,
  fase: 0,
  faseLabel: 'Aguardando...',
  agenteAtivo: null,
  cicloId: null,
  latestContent: null,
})

export const useAgentStore = create<Store>((set, get) => ({
  agents: Object.fromEntries(AGENT_IDS.map((id) => [id, initialAgentState()])),
  messages: [],
  flyingMessages: [],
  cycle: initialCycle(),
  wsConnected: false,

  processEvent: (event: AgentEvent) => {
    const { agente, tipo, mensagem, dados } = event

    const newMsg: Message = {
      id: `${Date.now()}-${Math.random()}`,
      agente,
      tipo,
      mensagem,
      timestamp: Date.now(),
      dados,
    }

    set((state) => ({
      messages: [newMsg, ...state.messages].slice(0, 300),
    }))

    // Atualiza estado do agente
    if (agente !== 'sistema') {
      const statusMap: Record<string, AgentState['status']> = {
        thinking: 'thinking',
        completed: 'completed',
        error: 'error',
        working: 'working',
      }
      const newStatus = statusMap[tipo] ?? 'working'

      set((state) => ({
        agents: {
          ...state.agents,
          [agente]: {
            status: newStatus,
            currentMessage: mensagem,
            lastUpdated: Date.now(),
          },
        },
      }))

      if (tipo === 'completed') {
        setTimeout(() => {
          set((state) => ({
            agents: {
              ...state.agents,
              [agente]: { ...state.agents[agente], status: 'idle' },
            },
          }))
        }, 3000)
      }
    }

    // Eventos de sistema
    if (agente === 'sistema') {
      if (tipo === 'cycle_start') {
        set((state) => ({
          cycle: {
            ...state.cycle,
            running: true,
            cicloId: (dados?.ciclo_id as string) ?? null,
            fase: 0,
            faseLabel: 'Iniciando ciclo...',
            agenteAtivo: null,
            latestContent: null,
          },
          agents: Object.fromEntries(AGENT_IDS.map((id) => [id, initialAgentState()])),
        }))
      }

      if (tipo === 'cycle_end' || tipo === 'cycle_cancelled') {
        set((state) => ({
          cycle: { ...state.cycle, running: false, agenteAtivo: null },
          agents: Object.fromEntries(AGENT_IDS.map((id) => [id, initialAgentState()])),
        }))
      }

      if (tipo === 'phase_change') {
        set((state) => ({
          cycle: {
            ...state.cycle,
            fase: (dados?.fase as number) ?? state.cycle.fase,
            faseLabel: mensagem,
            agenteAtivo: (dados?.agente_ativo as AgentId) ?? null,
          },
        }))
      }

      if (tipo === 'message_sent') {
        const from = dados?.de as AgentId
        const to = dados?.para as AgentId
        if (from && to) {
          const fm: FlyingMessage = {
            id: `fm-${Date.now()}-${Math.random()}`,
            from,
            to,
            tipo: (dados?.tipo as string) ?? 'mensagem',
            startTime: Date.now(),
          }
          get().addFlyingMessage(fm)
          setTimeout(() => get().removeFlyingMessage(fm.id), 2000)
        }
      }

      if (tipo === 'content_ready') {
        const ideias = dados?.ideias
        if (ideias && Array.isArray(ideias)) {
          set((state) => ({ cycle: { ...state.cycle, latestContent: { ideias } } }))
        }
      }
    }
  },

  addFlyingMessage: (fm) =>
    set((state) => ({ flyingMessages: [...state.flyingMessages, fm] })),

  removeFlyingMessage: (id) =>
    set((state) => ({ flyingMessages: state.flyingMessages.filter((f) => f.id !== id) })),

  setWsConnected: (connected) => set({ wsConnected: connected }),
}))
