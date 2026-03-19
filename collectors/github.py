import requests
import config
from datetime import datetime, timedelta


HEADERS = {"Accept": "application/vnd.github+json"}
if config.GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {config.GITHUB_TOKEN}"


def get_trending_repos(language: str = None, limit: int = 15) -> list:
    """Busca repositórios com crescimento recente de stars."""
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    query = f"stars:>100 pushed:>{yesterday}"
    if language:
        query += f" language:{language}"

    # Tópicos de AI/Vibe Coding
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    topics = ["llm", "ai-agent", "vibe-coding", "claude", "cursor", "copilot"]
    results = []

    for topic in topics:
        topic_query = f"topic:{topic} pushed:>{week_ago} stars:>10"
        response = requests.get(
            "https://api.github.com/search/repositories",
            params={"q": topic_query, "sort": "stars", "order": "desc", "per_page": 5},
            headers=HEADERS,
            timeout=10,
        )
        if response.status_code == 200:
            for repo in response.json().get("items", []):
                results.append({
                    "nome": repo["full_name"],
                    "descricao": repo["description"],
                    "stars": repo["stargazers_count"],
                    "url": repo["html_url"],
                    "topico": topic,
                    "linguagem": repo.get("language"),
                    "criado_em": repo["created_at"],
                    "atualizado_em": repo["pushed_at"],
                })

    # Deduplicar por URL
    seen = set()
    unique = []
    for r in results:
        if r["url"] not in seen:
            seen.add(r["url"])
            unique.append(r)

    return sorted(unique, key=lambda x: x["stars"], reverse=True)[:limit]


def get_new_ai_repos(limit: int = 10) -> list:
    """Repos de AI criados nos últimos 7 dias com tração rápida."""
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    query = f"topic:llm created:>{week_ago} stars:>100"

    response = requests.get(
        "https://api.github.com/search/repositories",
        params={"q": query, "sort": "stars", "order": "desc", "per_page": limit},
        headers=HEADERS,
        timeout=10,
    )

    if response.status_code != 200:
        return []

    repos = []
    for repo in response.json().get("items", []):
        repos.append({
            "nome": repo["full_name"],
            "descricao": repo["description"],
            "stars": repo["stargazers_count"],
            "url": repo["html_url"],
            "criado_em": repo["created_at"],
        })
    return repos
