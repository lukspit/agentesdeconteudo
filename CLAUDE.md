# Agentes Criadores de Conteúdo — Contexto Principal

Este projeto é um sistema multiagente autônomo de criação de conteúdo sobre **Inteligência Artificial e Vibe Coding**, baseado em dados reais extraídos da internet. Todos os agentes possuem personas inspiradas em mentes geniais históricas ou contemporâneas.

## O que é este projeto

Um time completo de agentes de IA que:
1. **Pesquisa a internet** (Twitter/X, GitHub, Reddit, YouTube) para identificar o que está bombando agora no mundo de AI e Vibe Coding
2. **Analisa tendências** com profundidade estratégica
3. **Cria conteúdo** adaptado para TikTok, Instagram e YouTube Shorts
4. **Critica e melhora** o conteúdo em ciclos iterativos entre agentes
5. **Adapta para cada plataforma** com linguagem e formato específicos

Os agentes se comunicam em hierarquia, se criticam mutuamente, e operam como um time real de produção de conteúdo — não em sequência linear, mas em loops de feedback.

## Stack Técnica

- **Linguagem**: Python
- **Framework de Agentes**: Claude Agent SDK (Anthropic)
- **Modelo**: Claude Sonnet 4.6 (`claude-sonnet-4-6`) — padrão para todos os agentes
- **Scraping Twitter/X**: `twikit` (sem API key, usa internal API) ou `twscrape`
- **Scraping Reddit**: `PRAW` (Python Reddit API Wrapper)
- **GitHub Trending**: GitHub REST API (free tier)
- **YouTube**: YouTube Data API v3
- **Orquestração**: Hierarquia de agentes com comunicação bidirecional

## Arquivos de Contexto

```
docs/
├── visao-geral.md        ← visão completa do projeto e filosofia
├── arquitetura.md        ← hierarquia e comunicação entre agentes
├── personas.md           ← cada agente e sua mente gênio
├── fontes-de-dados.md    ← Twitter/X, GitHub, Reddit, YouTube
└── roadmap.md            ← ordem de implementação
```

## Regras Fundamentais do Projeto

1. **Tudo baseado em dados reais** — nada de conteúdo genérico ou inventado. Sempre partir de tendências reais da internet.
2. **Agentes com personalidade forte** — cada agente age, fala e pensa como sua persona gênio. Não são apenas funções, são personagens.
3. **Hierarquia clara** — existe um Agente Estrategista que comanda os demais. Os agentes se reportam a ele.
4. **Feedback loops** — o conteúdo passa por ciclos de crítica antes de ser finalizado. Agentes se criticam entre si.
5. **Foco nas plataformas certas** — o suco do conteúdo de AI/Vibe Coding está no **Twitter/X**, **GitHub** e **Reddit**. TikTok, Instagram e YouTube são os canais de distribuição.
