# Roadmap de Implementação

## Princípio de Desenvolvimento

Começamos simples e funcional, depois adicionamos sofisticação. Cada fase entrega valor por si só — não esperamos a fase 4 para ter algo que funciona.

---

## Fase 0: Fundação (contexto e estrutura)
**Status: COMPLETO** ✓

- [x] Definição da visão do projeto
- [x] Arquitetura de agentes desenhada
- [x] Personas dos agentes definidas
- [x] Fontes de dados mapeadas
- [x] Contexto documentado para múltiplos chats

---

## Fase 1: Pesquisador Funcional
**Objetivo**: Um script Python que coleta dados reais e gera um relatório de tendências.

**Entregáveis:**
- [ ] Conector Twitter/X (twikit) — busca por hashtags e contas específicas
- [ ] Conector GitHub — trending repos e search por tópico
- [ ] Conector Reddit (PRAW) — hot posts dos subreddits prioritários
- [ ] Script de agregação que unifica as três fontes
- [ ] Output: `relatorio_tendencias.json` estruturado

**Critério de sucesso**: Rodar o script e receber em <2 minutos um relatório com as 10 tendências mais quentes do momento, com links para as fontes originais.

**Stack**: Python, twikit, praw, requests

---

## Fase 2: Agente Estrategista
**Objetivo**: O Estrategista (Sun Tzu) lê o relatório de tendências e gera um brief de conteúdo.

**Entregáveis:**
- [ ] Integração com Claude API (claude-sonnet-4-6)
- [ ] System prompt do Sun Tzu implementado
- [ ] Input: `relatorio_tendencias.json`
- [ ] Output: `brief_conteudo.json` com tópico escolhido, ângulo, plataforma prioritária

**Critério de sucesso**: Dado um relatório de tendências, o Estrategista escolhe o tópico certo pelo ângulo certo e justifica a escolha como um estrategista real.

---

## Fase 3: Agente Criativo + Crítico (loop)
**Objetivo**: Jobs cria o conteúdo, Sócrates questiona, Jobs revisa.

**Entregáveis:**
- [ ] System prompt do Steve Jobs implementado
- [ ] System prompt do Sócrates implementado
- [ ] Loop de crítica implementado (1-2 rodadas)
- [ ] Input: `brief_conteudo.json`
- [ ] Output: `rascunho_final.json` com roteiro, hook, caption

**Critério de sucesso**: O rascunho final tem um hook que para o scroll, um roteiro claro, e passou pela crítica socrática sem buracos óbvios.

---

## Fase 4: Agente Editor
**Objetivo**: Ogilvy faz o polimento final e entrega variações.

**Entregáveis:**
- [ ] System prompt do David Ogilvy implementado
- [ ] Input: `rascunho_final.json`
- [ ] Output: `conteudo_publicavel.json` com 3 variações de hook e título

**Critério de sucesso**: As variações de hook e título são claramente melhores que a primeira versão — mais específicas, mais curiosas, mais memoráveis.

---

## Fase 5: Orquestrador Central
**Objetivo**: Um único script que roda o ciclo completo de produção automaticamente.

**Entregáveis:**
- [ ] Orquestrador que gerencia o estado e o fluxo entre agentes
- [ ] Logging completo de cada etapa
- [ ] Controle de loops (anti-paralisia)
- [ ] Output final organizado por plataforma

**Critério de sucesso**: Rodar `python main.py` e receber, em <10 minutos, conteúdo pronto para publicar no TikTok, Instagram e YouTube, baseado em tendências do dia.

---

## Fase 6: Agente Analista (feedback loop)
**Objetivo**: Munger analisa performance histórica e alimenta o Estrategista.

**Entregáveis:**
- [ ] Input de métricas de performance (manual ou via API das plataformas)
- [ ] System prompt do Charlie Munger implementado
- [ ] Output: `principios_atualizados.json` que o Estrategista usa no próximo ciclo

**Critério de sucesso**: Depois de 2 semanas de uso, o sistema melhora a qualidade dos conteúdos com base no que está funcionando.

---

## Fase 7: Automação e Agendamento
**Objetivo**: O sistema roda sozinho todos os dias sem intervenção manual.

**Entregáveis:**
- [ ] Agendamento via cron ou scheduler
- [ ] Notificação quando conteúdo está pronto (Slack, email, ou Telegram)
- [ ] Dashboard simples de acompanhamento

---

## Considerações Técnicas por Fase

### Autenticação e Credenciais
```
.env (nunca commitar)
├── ANTHROPIC_API_KEY
├── TWITTER_USERNAME
├── TWITTER_PASSWORD
├── GITHUB_TOKEN
├── REDDIT_CLIENT_ID
├── REDDIT_CLIENT_SECRET
└── YOUTUBE_API_KEY
```

### Estrutura de Arquivos do Projeto
```
/
├── CLAUDE.md                    ← contexto principal
├── docs/                        ← documentação do projeto
├── research/                    ← relatórios gerados pelo Pesquisador
├── output/                      ← conteúdos gerados
│   ├── briefs/
│   ├── rascunhos/
│   └── publicaveis/
├── agents/                      ← código dos agentes
│   ├── pesquisador.py
│   ├── estrategista.py
│   ├── criativo.py
│   ├── critico.py
│   ├── editor.py
│   └── analista.py
├── collectors/                  ← conectores de dados
│   ├── twitter.py
│   ├── github.py
│   ├── reddit.py
│   └── youtube.py
├── orchestrator.py              ← orquestrador central
├── main.py                      ← ponto de entrada
├── config.py                    ← configurações
└── requirements.txt
```

### Modelo de Custo Estimado (Claude API)
- Cada ciclo completo ≈ 50.000-100.000 tokens (todos os agentes)
- claude-sonnet-4-6: ~$3 por ciclo completo estimado
- 5 ciclos/semana = ~$15/semana = ~$60/mês

---

## O que NÃO Fazer (Aprendizados Antecipados)

1. **Não construir tudo de uma vez** — cada fase funciona independente
2. **Não usar mocks** — todos os testes usam dados reais da internet
3. **Não over-engenhering os system prompts** — começar simples e refinar com uso
4. **Não ignorar rate limits** — implementar delays e retry logic desde o início
5. **Não hardcodar credenciais** — usar .env desde o primeiro commit
