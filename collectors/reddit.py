import requests

SUBREDDITS = [
    "LocalLLaMA",
    "ClaudeAI",
    "MachineLearning",
    "vibecoding",
    "ChatGPT",
    "artificial",
]

# Reddit exige um User-Agent descritivo, senão bloqueia
HEADERS = {"User-Agent": "ContentAgents/1.0 (research bot)"}


def get_hot_posts(limit_per_sub: int = 5) -> list:
    """
    Coleta posts quentes dos subreddits via JSON público.
    Não precisa de nenhuma credencial.
    """
    posts = []

    for sub in SUBREDDITS:
        try:
            url = f"https://www.reddit.com/r/{sub}/hot.json?limit={limit_per_sub}"
            response = requests.get(url, headers=HEADERS, timeout=10)

            if response.status_code != 200:
                continue

            for item in response.json()["data"]["children"]:
                post = item["data"]
                if post.get("stickied"):
                    continue
                posts.append({
                    "titulo": post["title"],
                    "subreddit": sub,
                    "upvotes": post["score"],
                    "comentarios": post["num_comments"],
                    "url": f"https://reddit.com{post['permalink']}",
                    "texto": post.get("selftext", "")[:500] or None,
                    "flair": post.get("link_flair_text"),
                })
        except Exception as e:
            posts.append({"erro": f"r/{sub}: {str(e)}"})

    return sorted(posts, key=lambda x: x.get("upvotes", 0), reverse=True)
