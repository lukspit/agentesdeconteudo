import asyncio
import config

HASHTAGS = ["#VibeCoding", "#ClaudeCode", "#AIcoding", "#CursorAI", "#LLM", "#AIagents"]
CONTAS_CHAVE = ["karpathy", "sama", "ylecun", "AndrewYNg", "gdb"]


async def _buscar_tweets(hashtag: str, limit: int) -> list[dict]:
    try:
        from twikit import Client
    except ImportError:
        return [{"erro": "twikit não instalado. Execute: pip install twikit"}]

    if not config.TWITTER_USERNAME or not config.TWITTER_PASSWORD:
        return [{"erro": "Credenciais do Twitter não configuradas no .env"}]

    client = Client("en-US")
    await client.login(
        auth_info_1=config.TWITTER_USERNAME,
        password=config.TWITTER_PASSWORD,
    )

    tweets = []
    results = await client.search_tweet(hashtag, "Latest", count=limit)
    for tweet in results:
        tweets.append({
            "texto": tweet.text,
            "autor": tweet.user.screen_name,
            "likes": tweet.favorite_count,
            "retweets": tweet.retweet_count,
            "url": f"https://x.com/{tweet.user.screen_name}/status/{tweet.id}",
            "hashtag": hashtag,
        })
    return tweets


def get_trending_tweets(limit_per_hashtag: int = 10) -> list[dict]:
    """
    Coleta tweets por hashtag e retorna os mais relevantes.
    Fallback para lista vazia se Twitter não estiver configurado.
    """
    async def run():
        todos = []
        for hashtag in HASHTAGS[:3]:  # limita a 3 hashtags para não sobrecarregar
            tweets = await _buscar_tweets(hashtag, limit_per_hashtag)
            todos.extend(tweets)
        return todos

    try:
        tweets = asyncio.run(run())
        return sorted(tweets, key=lambda x: x.get("likes", 0), reverse=True)
    except Exception as e:
        return [{"aviso": f"Twitter não disponível: {str(e)}. Continuando sem dados do Twitter."}]
