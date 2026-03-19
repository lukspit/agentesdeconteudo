"""
Cliente Supabase para persistência do sistema de agentes.
Todas as operações de banco passam por aqui.
"""
import config
from supabase import create_client, Client
from datetime import datetime, timezone

_client: Client = None


def get_client() -> Client:
    global _client
    if _client is None:
        if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar no .env")
        _client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    return _client


def setup_tables():
    """Cria as tabelas se ainda não existirem. Chama uma vez na inicialização."""
    client = get_client()

    schema_sql = """
    CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ciclo_id TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content_ideas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        topico TEXT NOT NULL,
        tese TEXT,
        angulo TEXT,
        contexto TEXT,
        links JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        usado BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS hooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
        variacao INTEGER NOT NULL,
        estrategia TEXT,
        falado TEXT,
        titulo TEXT,
        subtitulo TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trends_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topico TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """

    client.rpc("exec_sql", {"sql": schema_sql}).execute()


def save_session(ciclo_id: str) -> str:
    """Cria uma nova sessão e retorna o UUID."""
    client = get_client()
    result = client.table("ca_sessions").insert({"ciclo_id": ciclo_id}).execute()
    return result.data[0]["id"]


def save_idea(session_id: str, ideia: dict, hooks: list) -> str:
    """Salva uma ideia com seus hooks. Retorna o UUID da ideia."""
    client = get_client()

    idea_row = {
        "session_id": session_id,
        "topico": ideia.get("topico", ""),
        "tese": ideia.get("tese_original") or ideia.get("tese", ""),
        "angulo": ideia.get("angulo_refinado", ""),
        "contexto": ideia.get("contexto", ""),
        "links": ideia.get("links", []),
    }
    idea_result = client.table("ca_content_ideas").insert(idea_row).execute()
    idea_id = idea_result.data[0]["id"]

    hook_rows = [
        {
            "idea_id": idea_id,
            "variacao": h.get("variacao"),
            "estrategia": h.get("estrategia", ""),
            "falado": h.get("falado", ""),
            "titulo": h.get("titulo", ""),
            "subtitulo": h.get("subtitulo", ""),
        }
        for h in hooks
    ]
    if hook_rows:
        client.table("ca_hooks").insert(hook_rows).execute()

    client.table("ca_trends_history").insert({"topico": ideia.get("topico", "")}).execute()

    return idea_id


def get_recent_topics(limit: int = 20) -> list:
    """Retorna os tópicos cobertos recentemente para o Curador evitar repetição."""
    client = get_client()
    result = (
        client.table("ca_trends_history")
        .select("topico, created_at")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [row["topico"] for row in result.data]
