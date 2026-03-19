export type AgentId =
  | 'pesquisador'
  | 'curador'
  | 'estrategista_pauta'
  | 'hook_writer'
  | 'critico_hooks'
  | 'sistema'

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'completed' | 'error'

export interface AgentEvent {
  agente: AgentId
  tipo: string
  mensagem: string
  dados?: Record<string, unknown>
}

export interface AgentInfo {
  id: AgentId
  persona: string
  role: string
  color: string
  colorHex: number
  emoji: string
}

export interface AgentState {
  status: AgentStatus
  currentMessage: string
  lastUpdated: number
}

export interface Message {
  id: string
  agente: AgentId
  tipo: string
  mensagem: string
  timestamp: number
  dados?: Record<string, unknown>
}

export interface FlyingMessage {
  id: string
  from: AgentId
  to: AgentId
  tipo: string
  startTime: number
}

export interface CycleState {
  running: boolean
  fase: number
  faseLabel: string
  agenteAtivo: AgentId | null
  cicloId: string | null
  latestContent: LatestContent | null
}

export interface LatestContent {
  ideias: Ideia[]
}

export interface Ideia {
  topico: string
  tese: string
  angulo: string
  frase_posicionamento: string
  contexto: string
  links: string[]
  hooks: Hook[]
}

export interface Hook {
  variacao: number
  estrategia: string
  falado: string
  titulo: string
  subtitulo: string
}

export const AGENT_CONFIG: Record<string, AgentInfo> = {
  pesquisador: {
    id: 'pesquisador',
    persona: 'Feynman',
    role: 'Pesquisador',
    color: '#f39c12',
    colorHex: 0xf39c12,
    emoji: '🔬',
  },
  curador: {
    id: 'curador',
    persona: 'Munger',
    role: 'Curador',
    color: '#7f8c8d',
    colorHex: 0x7f8c8d,
    emoji: '🧠',
  },
  estrategista_pauta: {
    id: 'estrategista_pauta',
    persona: 'Paul Graham',
    role: 'Estrategista',
    color: '#27ae60',
    colorHex: 0x27ae60,
    emoji: '💡',
  },
  hook_writer: {
    id: 'hook_writer',
    persona: 'Gary Halbert',
    role: 'Hook Writer',
    color: '#e74c3c',
    colorHex: 0xe74c3c,
    emoji: '✍️',
  },
  critico_hooks: {
    id: 'critico_hooks',
    persona: 'Sócrates',
    role: 'Crítico',
    color: '#9b59b6',
    colorHex: 0x9b59b6,
    emoji: '🏛️',
  },
}

export const AGENT_IDS: AgentId[] = [
  'pesquisador',
  'curador',
  'estrategista_pauta',
  'hook_writer',
  'critico_hooks',
]

export const FASE_LABELS: Record<number, string> = {
  1: 'Coletando dados da internet',
  2: 'Feynman vasculhando os sinais',
  3: 'Munger selecionando as melhores ideias',
  4: 'Paul Graham validando os ângulos',
  5: 'Gary Halbert criando os hooks',
  6: 'Sócrates questionando os hooks',
}
