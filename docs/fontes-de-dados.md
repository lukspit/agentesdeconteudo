# Fontes de Dados — Onde Está o Suco

## Filosofia de Coleta

O sistema só cria conteúdo baseado em dados reais e recentes. Isso significa que o Pesquisador (da Vinci) precisa de acesso a fontes que reflitam o que está acontecendo **agora** — não o que era relevante há 30 dias.

A estratégia de coleta é em camadas:
1. **Fontes primárias** (Twitter/X, GitHub) — onde as tendências nascem
2. **Fontes de validação** (Reddit) — onde a comunidade debate e aprofunda
3. **Fontes de benchmark** (YouTube) — onde entendemos o que está performando

---

## Twitter/X — A Fonte Principal

### Por que é o mais importante
O Twitter/X é onde os principais pesquisadores, engenheiros e criadores de conteúdo de AI postam primeiro. Andrej Karpathy lançou o conceito de Vibe Coding num tweet. Sam Altman anuncia produtos no X. As discussões técnicas mais quentes acontecem lá.

### O que monitorar

**Contas obrigatórias:**
- `@karpathy` — Andrej Karpathy (criador do termo Vibe Coding)
- `@sama` — Sam Altman (CEO OpenAI)
- `@ylecun` — Yann LeCun (Meta AI, visão crítica)
- `@AndrewYNg` — Andrew Ng (referência em AI education)
- `@demishassabis` — Demis Hassabis (Google DeepMind)
- `@jneidel_` — Jensen Huang (Nvidia CEO, AI hardware)
- `@ilyasut` — Ilya Sutskever (Safe Superintelligence)
- `@gdb` — Greg Brockman (OpenAI co-fundador)
- `@paulg` — Paul Graham (Y Combinator, pensador influente)

**Hashtags para monitorar:**
- `#VibeCoding`
- `#ClaudeCode`
- `#AIcoding`
- `#Cursor` / `#CursorAI`
- `#LLM`
- `#AIagents`
- `#BuildWithAI`

**Tipos de conteúdo de alto valor:**
- Threads técnicas com alto engajamento (>500 likes)
- Demos em vídeo de novas ferramentas
- Debates entre figuras-chave
- Anúncios de produtos/modelos novos

### Ferramentas de Coleta

**Opção 1: twikit (recomendada — gratuita)**
```python
# github.com/d60/twikit
# Usa a internal API do Twitter. Sem API key.
pip install twikit

from twikit import Client
client = Client('en-US')
await client.login(auth_info_1=USERNAME, password=PASSWORD)
tweets = await client.search_tweet('#VibeCoding', 'Latest')
```

**Opção 2: twscrape**
```python
# github.com/vladkens/twscrape
# Suporta múltiplas contas para escalar
pip install twscrape
```

**Limitações importantes:**
- O X oficial cobra $100/mês para 15k tweets ou $5k/mês para 1M tweets
- Soluções de scraping estão em constante gato-e-rato com o X
- A partir de janeiro 2025, o X implementou browser fingerprinting — IPs de datacenter são banidos
- Use contas reais e rotação de IPs residenciais para estabilidade

---

## GitHub — Onde o Código Fala

### Por que é valioso
GitHub Trending mostra em tempo real o que os desenvolvedores estão construindo e estrelando. Um repositório que ganha 500 stars em 24h é uma notícia. É onde projetos como Cursor, Open Interpreter, e outros explodiram antes de chegar às mídias.

### O que monitorar

**GitHub Trending:**
- Trending diário: `https://github.com/trending?since=daily`
- Trending por linguagem (Python): `https://github.com/trending/python?since=daily`
- Trending semanal para padrões de médio prazo

**Tópicos/tags relevantes:**
- `llm`, `ai-agent`, `claude`, `openai`, `vibe-coding`
- `cursor`, `copilot`, `code-generation`
- `autonomous-agent`, `multi-agent`

**Sinais de alto valor:**
- Repo novo (<30 dias) com >1000 stars
- Crescimento anormal de stars num repo existente (indica nova feature ou viral)
- Issues com muita discussão em repos de AI tools
- PRs mergeadas em repos importantes (ex: novo modelo suportado no Cursor)

### Ferramentas de Coleta

**GitHub REST API (gratuita — 5000 req/hora com auth):**
```python
import requests

headers = {"Authorization": f"token {GITHUB_TOKEN}"}

# Trending (scraping — não há API oficial)
# Use o repositório github-trending-api ou scrape diretamente
response = requests.get(
    "https://api.github.com/search/repositories",
    params={
        "q": "topic:llm created:>2026-03-17",
        "sort": "stars",
        "order": "desc"
    },
    headers=headers
)

# Repos que explodiram em stars recentemente
response = requests.get(
    "https://api.github.com/search/repositories",
    params={
        "q": "stars:>500 pushed:>2026-03-17 language:python topic:ai",
        "sort": "stars",
        "order": "desc"
    },
    headers=headers
)
```

---

## Reddit — A Câmara de Eco Técnica

### Por que é valioso
Reddit tem comunidades técnicas que analisam e debatem em profundidade o que o Twitter apenas menciona. Um thread no r/LocalLLaMA com 500 comentários é uma mina de ouro de ângulos de conteúdo — revela as dúvidas reais, as frustrações, e os insights da comunidade.

### Subreddits prioritários

| Subreddit | Tamanho | Foco | Relevância |
|-----------|---------|------|-----------|
| r/LocalLLaMA | ~500k | LLMs locais, modelos, benchmarks | ALTA |
| r/MachineLearning | ~3M | Pesquisa acadêmica e aplicada | ALTA |
| r/ChatGPT | ~7M | Uso prático do ChatGPT | MÉDIA |
| r/ClaudeAI | ~200k | Claude específico | ALTA |
| r/vibecoding | crescendo | Vibe coding específico | ALTA |
| r/learnmachinelearning | ~400k | Iniciantes em ML | MÉDIA |
| r/artificial | ~1M | AI geral | MÉDIA |
| r/programming | ~6M | Dev geral | BAIXA-MÉDIA |
| r/startups | ~2M | Casos de uso de AI em startups | MÉDIA |

### O que extrair dos posts

- **Posts com >100 upvotes nas últimas 24h** = tendência validada
- **Comentários com alto karma** = o que a comunidade realmente pensa
- **Perguntas frequentes** = gaps de conteúdo educacional a preencher
- **Frustrações repetidas** = conteúdo "eu resolvi isso" que vai performar

### Ferramentas de Coleta

**PRAW — Python Reddit API Wrapper (gratuita):**
```python
pip install praw

import praw

reddit = praw.Reddit(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    user_agent="ContentAgent/1.0"
)

# Top posts do dia em subreddits-chave
subreddit = reddit.subreddit("LocalLLaMA+ClaudeAI+vibecoding")
for post in subreddit.hot(limit=25):
    print(post.title, post.score, post.url)
```

**Pushshift (histórico, quando disponível):**
- Permite análise histórica de posts e comentários
- Nem sempre disponível — status varia

---

## YouTube — Benchmark de Formato

### Por que monitorar (mas não scrape agressivo)
YouTube não é fonte de tendências primárias para nosso nicho, mas é onde entendemos **que formato de vídeo está performando**. Títulos de vídeos com muitas views revelam hooks eficazes. Thumbnails com alto CTR revelam o visual que funciona.

### O que analisar
- Títulos dos 20 vídeos mais vistos sobre "vibe coding", "Claude Code", "Cursor AI"
- Padrões de thumbnail (cor, texto, expressão facial)
- Duração dos vídeos que performam melhor
- Canais que cresceram mais rápido no último mês

### Canais para monitorar
- Fireship (formato ultra-conciso)
- NetworkChuck
- Theo — t3.gg
- Matt Wolfe (AI geral)
- Andrej Karpathy (quando posta)
- Lex Fridman (entrevistas longas)

### Ferramentas de Coleta

**YouTube Data API v3 (gratuita — 10.000 unidades/dia):**
```python
from googleapiclient.discovery import build

youtube = build("youtube", "v3", developerKey=API_KEY)

# Buscar vídeos recentes sobre vibe coding
request = youtube.search().list(
    part="snippet",
    q="vibe coding claude code 2026",
    type="video",
    order="viewCount",
    publishedAfter="2026-03-01T00:00:00Z",
    maxResults=20
)
```

---

## Sinais de Ouro: Quando o Pesquisador Prioriza

O Pesquisador (da Vinci) deve sinalizar como **PRIORIDADE MÁXIMA** quando:

1. **Mesmo tema aparece em 3+ fontes simultâneas** — Twitter + GitHub + Reddit no mesmo dia = confirma que é real
2. **Figura-chave posta algo pela primeira vez** — Karpathy, Sam Altman ou similar postando sobre uma ferramenta nova que nunca mencionou
3. **Repo explode do nada** — GitHub repo que saiu do 0 para 2000 stars em 48h
4. **Thread vira controvérsia** — posts com muitos downvotes ou debate intenso revelam tensões reais na comunidade (ótimo para conteúdo de opinião)
5. **Produto lançado** — anúncio de nova versão de Claude, GPT, Cursor, etc.

---

## Frequência de Coleta Recomendada

| Fonte | Frequência | Volume |
|-------|-----------|--------|
| Twitter/X (hashtags) | A cada 4h | Top 50 tweets |
| Twitter/X (contas) | A cada 6h | Últimos posts das contas prioritárias |
| GitHub Trending | 1x ao dia (manhã) | Top 25 repos do dia |
| Reddit (hot) | A cada 6h | Top 10 por subreddit |
| YouTube | 1x ao dia | Top 20 vídeos da semana |
