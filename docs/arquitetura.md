# Arquitetura do Sistema Multiagente

## Visão Geral

O sistema é baseado no **Claude Agent SDK** (Anthropic). Cada agente roda como um processo independente com contexto próprio, mas se comunicam através de um orquestrador central.

A arquitetura não é linear (A→B→C→D). É um **grafo de comunicação** onde agentes podem se chamar bidirecionalmente, criar loops de feedback, e o Estrategista pode interromper e redirecionar qualquer fluxo.

## Diagrama de Comunicação

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO DE PRODUÇÃO                        │
│                                                             │
│  [INTERNET]                                                 │
│  Twitter/X ──┐                                              │
│  GitHub     ──┤──→ [PESQUISADOR]  ──→  [ESTRATEGISTA]       │
│  Reddit     ──┘    (da Vinci)          (Sun Tzu)            │
│                                             │               │
│                              ┌──────────────┘               │
│                              ↓                              │
│                         [CRIATIVO]  ←──────→  [CRÍTICO]     │
│                         (Jobs)                (Sócrates)    │
│                              │           (loop de feedback) │
│                              ↓                              │
│                         [EDITOR]                            │
│                         (Ogilvy)                            │
│                              │                              │
│                              ↓                              │
│                    [CONTEÚDO FINALIZADO]                    │
│              TikTok / Instagram / YouTube                   │
│                              │                              │
│                              ↓                              │
│                        [ANALISTA]  ──→  [ESTRATEGISTA]      │
│                        (Munger)         (feedback loop)     │
└─────────────────────────────────────────────────────────────┘
```

## Fases do Ciclo de Produção

### Fase 1: Inteligência (Pesquisador → Estrategista)

O Pesquisador (da Vinci) executa scraping das fontes de dados e entrega ao Estrategista um **Relatório de Tendências** com:
- Top 10 tópicos em ascensão (últimas 24h)
- Repositórios GitHub com crescimento anormal de stars
- Threads do Reddit com alto engajamento e debate
- Tweets/threads de figuras-chave do ecossistema AI

O Estrategista (Sun Tzu) analisa o relatório e define:
- **1-3 tópicos prioritários** para criar conteúdo hoje
- **Ângulo estratégico** para cada tópico (o que ainda não foi explorado)
- **Plataforma prioritária** para cada peça
- **Brief detalhado** para o Criativo

### Fase 2: Criação (Estrategista → Criativo ↔ Crítico)

O Criativo (Jobs) recebe o brief e produz:
- Hook (primeiros 3 segundos)
- Roteiro completo
- Caption adaptado por plataforma
- Sugestões de visual/thumbnail

O Crítico (Sócrates) recebe o mesmo brief + o conteúdo criado e retorna:
- 3-5 perguntas que o conteúdo precisa responder melhor
- Premissas não testadas identificadas
- Potenciais rejeições do espectador

O Criativo recebe as perguntas do Crítico e **revisa**. Esse loop acontece **1-2 vezes** (controlado pelo Estrategista para evitar paralisia).

### Fase 3: Polimento (Criativo → Editor)

O Editor (Ogilvy) recebe o conteúdo revisado e entrega:
- Hook otimizado (3 variações)
- Título/caption otimizado (3 variações)
- CTA revisada e contextualizada
- Notas de copywriting com justificativas

### Fase 4: Análise (Analista → Estrategista)

Após publicação, o Analista (Munger) analisa métricas e retorna ao Estrategista:
- Princípios atualizados do que está funcionando
- Erros sistemáticos identificados
- Recomendações para o próximo ciclo

## Padrões de Comunicação Entre Agentes

### Formato de Mensagem Padrão

Cada agente envia mensagens estruturadas:

```json
{
  "de": "pesquisador",
  "para": "estrategista",
  "tipo": "relatorio_tendencias",
  "prioridade": "alta",
  "dados": { ... },
  "requer_resposta": true,
  "timestamp": "2026-03-18T10:00:00Z"
}
```

### Tipos de Mensagem

| Tipo | Quem envia | Para quem | Descrição |
|------|-----------|-----------|-----------|
| `relatorio_tendencias` | Pesquisador | Estrategista | Dados brutos + observações |
| `brief_conteudo` | Estrategista | Criativo | Instruções de criação |
| `rascunho_v1` | Criativo | Crítico + Editor | Primeiro rascunho |
| `critica_socratica` | Crítico | Criativo | Perguntas sem resposta |
| `rascunho_revisado` | Criativo | Editor | Após responder críticas |
| `conteudo_final` | Editor | Estrategista | Conteúdo aprovado + variações |
| `relatorio_performance` | Analista | Estrategista | Métricas + princípios |
| `atualizacao_estrategia` | Estrategista | Todos | Mudança de direção |

### Controle de Loop (Anti-paralisia)

O Estrategista controla quantas rodadas de crítica acontecem:
- **Loop padrão**: 1 rodada de crítica → 1 revisão
- **Loop intensificado**: 2 rodadas (para conteúdo de alto impacto)
- **Bypass**: Estrategista pode pular a crítica se o tópico é urgente (notícia quente)

## Configuração de Contexto por Agente

### Contexto fixo (sempre presente)
- Persona e metodologia do agente
- Regras fundamentais do projeto
- Plataformas alvo e seus formatos

### Contexto dinâmico (por sessão)
- Tendências do dia (do Pesquisador)
- Brief do Estrategista
- Histórico recente de performance (do Analista)
- Conteúdos similares já criados (para evitar repetição)

## Paralelismo

Alguns processos podem rodar em paralelo:
- **Pesquisador** coleta dados enquanto **Analista** processa métricas do dia anterior
- **Crítico** analisa enquanto **Estrategista** já prepara brief para o próximo tópico
- **Editor** trabalha em 3 peças simultâneas (uma por plataforma)

## Tecnologia de Implementação

```python
# Estrutura de implementação (Claude Agent SDK)

from claude_agent_sdk import Agent, Orchestrator

# Cada agente é instanciado com sua persona e ferramentas
pesquisador = Agent(
    name="pesquisador_davinci",
    system_prompt=DAVINCI_SYSTEM_PROMPT,
    tools=[twitter_scraper, github_api, reddit_api]
)

estrategista = Agent(
    name="estrategista_suntzu",
    system_prompt=SUNTZU_SYSTEM_PROMPT,
    tools=[send_message, receive_message]
)

# O orquestrador gerencia o fluxo e o estado
orquestrador = Orchestrator(
    agents=[pesquisador, estrategista, criativo, critico, editor, analista],
    state_manager=StateManager()
)
```

## Estado Compartilhado

O sistema mantém um **estado central** que todos os agentes podem ler (mas só o orquestrador pode escrever):

```json
{
  "ciclo_atual": {
    "id": "2026-03-18-001",
    "tendencias": [...],
    "brief_ativo": {...},
    "conteudos_em_producao": [...],
    "status": "criacao"
  },
  "historico": {
    "ultimas_24h": [...],
    "principios_ativos": [...]
  }
}
```
