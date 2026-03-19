CREATE TABLE ca_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ciclo_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ca_content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ca_sessions(id) ON DELETE CASCADE,
    topico TEXT NOT NULL,
    tese TEXT,
    angulo TEXT,
    contexto TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    usado BOOLEAN DEFAULT FALSE
);

CREATE TABLE ca_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES ca_content_ideas(id) ON DELETE CASCADE,
    variacao INTEGER NOT NULL,
    estrategia TEXT,
    falado TEXT,
    titulo TEXT,
    subtitulo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ca_trends_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topico TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
