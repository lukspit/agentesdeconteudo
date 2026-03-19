"""
Orquestrador v2 — Produz pacotes de ideia + hooks, não roteiros.

Fluxo:
  Coleta → Feynman (sinais) → Munger (3 ideias) → Paul Graham (ângulo)
         → Gary Halbert (hooks) ↔ Sócrates (crítica) → Output + Supabase
"""
import json
import os
import threading
from datetime import datetime

from agents.base import event_bus
from agents.registry import get_agent
from collectors import github, reddit, twitter
from database import supabase_client
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

CORES = {
    "pesquisador": "bold yellow",
    "curador": "bold blue",
    "estrategista_pauta": "bold red",
    "hook_writer": "bold cyan",
    "critico_hooks": "bold magenta",
    "sistema": "white",
}


def console_handler(event: dict):
    cor = CORES.get(event["agente"], "white")
    agente = event["agente"].upper()
    tipo = event["tipo"]
    msg = event["mensagem"]

    if tipo == "thinking":
        console.print(f"  [{cor}]{agente}[/{cor}] 💭 {msg}")
    elif tipo == "completed":
        console.print(f"  [{cor}]{agente}[/{cor}] ✅ {msg}")
    elif tipo == "error":
        console.print(f"  [{cor}]{agente}[/{cor}] ❌ {msg}")


event_bus.subscribe(console_handler)


def _fase(titulo: str, estilo: str = "bold white"):
    console.print(Panel(titulo, style=estilo))


def _sys(tipo: str, mensagem: str, dados: dict = None):
    """Emite evento de sistema para o frontend (fases, roteamento)."""
    event_bus.emit("sistema", tipo, mensagem, dados or {})


def coletar_dados() -> dict:
    _fase("📡 Fase 1: Coletando dados da internet...", "bold")
    github_data = github.get_trending_repos(limit=15)
    console.print(f"  GitHub: {len(github_data)} repos")
    reddit_data = reddit.get_hot_posts(limit_per_sub=5)
    console.print(f"  Reddit: {len(reddit_data)} posts")
    twitter_data = twitter.get_trending_tweets(limit_per_hashtag=10)
    console.print(f"  Twitter/X: {len(twitter_data)} tweets")
    return {"github": github_data, "reddit": reddit_data, "twitter": twitter_data}


class CicloCancelado(Exception):
    pass


def rodar_ciclo(cancel_event: threading.Event = None) -> dict:
    def _checar_cancelamento():
        if cancel_event and cancel_event.is_set():
            _sys("phase_change", "Ciclo cancelado pelo usuário", {"fase": 0, "agente_ativo": None})
            raise CicloCancelado()

    ciclo_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    console.print(Panel(f"🚀 Ciclo [{ciclo_id}] — Produzindo pacotes de ideia + hooks", style="bold white on blue"))
    _sys("cycle_start", f"Ciclo {ciclo_id} iniciado", {"ciclo_id": ciclo_id})

    # --- Fase 1: Coleta
    _checar_cancelamento()
    _sys("phase_change", "Fase 1: Coletando dados da internet", {"fase": 1, "agente_ativo": "pesquisador"})
    dados_brutos = coletar_dados()

    # --- Fase 2: Feynman interpreta os sinais
    _checar_cancelamento()
    _fase("🔬 Fase 2: Feynman vasculhando os sinais...", "yellow")
    _sys("phase_change", "Fase 2: Feynman vasculhando os sinais", {"fase": 2, "agente_ativo": "pesquisador"})
    pesquisador = get_agent("pesquisador")
    relatorio = pesquisador.execute({"dados_brutos": dados_brutos})
    _sys("message_sent", "Sinais enviados ao Munger", {"de": "pesquisador", "para": "curador", "tipo": "sinais"})

    # --- Fase 3: Munger seleciona 3 ideias
    _checar_cancelamento()
    _fase("🧠 Fase 3: Munger curando as melhores ideias...", "blue")
    _sys("phase_change", "Fase 3: Munger selecionando as melhores ideias", {"fase": 3, "agente_ativo": "curador"})
    historico = supabase_client.get_recent_topics(limit=30)
    curador = get_agent("curador")
    curadoria = curador.execute({
        "sinais": relatorio.get("sinais", []),
        "historico_topicos": historico,
    })
    _sys("message_sent", "3 ideias enviadas ao Paul Graham", {"de": "curador", "para": "estrategista_pauta", "tipo": "ideias"})

    # --- Fase 4: Paul Graham valida os ângulos
    _checar_cancelamento()
    _fase("💡 Fase 4: Paul Graham validando os ângulos...", "red")
    _sys("phase_change", "Fase 4: Paul Graham validando os ângulos", {"fase": 4, "agente_ativo": "estrategista_pauta"})
    estrategista = get_agent("estrategista_pauta")
    validacao = estrategista.execute({"ideias": curadoria.get("ideias", [])})
    ideias_validadas = [i for i in validacao.get("ideias_validadas", []) if i.get("aprovado", True)]
    _sys("message_sent", "Ângulos validados enviados ao Gary Halbert", {"de": "estrategista_pauta", "para": "hook_writer", "tipo": "ideias_validadas"})

    # --- Fase 5 + 6: Gary Halbert cria hooks ↔ Sócrates questiona (1 ciclo)
    hooks_finais = None

    for iteracao in range(1, 3):  # 2 iterações máximo
        _checar_cancelamento()
        _fase(f"✍️  Fase 5.{iteracao}: Gary Halbert criando hooks (v{iteracao})...", "cyan")
        _sys("phase_change", f"Fase 5.{iteracao}: Gary Halbert criando hooks", {"fase": 5, "agente_ativo": "hook_writer", "iteracao": iteracao})
        hook_writer = get_agent("hook_writer")

        task_hooks = {"ideias_validadas": ideias_validadas, "iteracao": iteracao}
        if hooks_finais and iteracao > 1:
            task_hooks["criticas_socraticas"] = criticas_hooks

        hooks_finais = hook_writer.execute(task_hooks)

        if iteracao == 1:
            _checar_cancelamento()
            _fase("🏛️  Fase 6: Sócrates questionando os hooks...", "magenta")
            _sys("message_sent", "Hooks enviados ao Sócrates", {"de": "hook_writer", "para": "critico_hooks", "tipo": "hooks"})
            _sys("phase_change", "Fase 6: Sócrates questionando os hooks", {"fase": 6, "agente_ativo": "critico_hooks"})
            critico = get_agent("critico_hooks")
            criticas_hooks = critico.execute({"pacotes": hooks_finais.get("pacotes", [])})
            _sys("message_sent", "Críticas enviadas de volta ao Gary Halbert", {"de": "critico_hooks", "para": "hook_writer", "tipo": "criticas"})

    # --- Monta output final por ideia
    pacotes_finais = hooks_finais.get("pacotes", [])
    ideias_output = []

    for ideia in ideias_validadas:
        topico = ideia.get("topico", "")
        pacote_hooks = next(
            (p for p in pacotes_finais if p.get("topico", "").lower() in topico.lower()
             or topico.lower() in p.get("topico", "").lower()),
            {}
        )
        ideias_output.append({
            "topico": topico,
            "tese": ideia.get("tese_original") or ideia.get("tese", ""),
            "angulo": ideia.get("angulo_refinado", ""),
            "frase_posicionamento": ideia.get("frase_de_posicionamento", ""),
            "contexto": ideia.get("contexto", ""),
            "links": ideia.get("links", []),
            "hooks": pacote_hooks.get("hooks", []),
        })

    resultado = {
        "ciclo_id": ciclo_id,
        "ideias": ideias_output,
    }

    # --- Salva no Supabase
    try:
        session_id = supabase_client.save_session(ciclo_id)
        for ideia in ideias_output:
            supabase_client.save_idea(session_id, ideia, ideia.get("hooks", []))
        console.print("  [green]✅ Salvo no Supabase[/green]")
    except Exception as e:
        console.print(f"  [yellow]⚠️ Supabase falhou ({e}) — continuando sem persistência[/yellow]")

    # --- Salva em arquivo local
    os.makedirs("output", exist_ok=True)
    output_path = f"output/ciclo-{ciclo_id}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    _sys("content_ready", "Conteúdo pronto!", {"ideias": ideias_output, "ciclo_id": ciclo_id})

    # --- Exibe resumo no terminal
    _exibir_resumo(resultado, output_path)

    return resultado


def _exibir_resumo(resultado: dict, output_path: str):
    console.print()
    console.print(Panel(f"✅ Ciclo completo! Salvo em: {output_path}", style="bold green"))

    for i, ideia in enumerate(resultado.get("ideias", []), 1):
        table = Table(title=f"💡 Ideia {i}: {ideia['topico']}", show_header=True)
        table.add_column("Variação", style="bold", width=4)
        table.add_column("Falado (hook)", width=40)
        table.add_column("Título", width=30)
        table.add_column("Subtítulo", width=30)

        for h in ideia.get("hooks", []):
            table.add_row(
                str(h.get("variacao", "?")),
                h.get("falado", ""),
                h.get("titulo", ""),
                h.get("subtitulo", ""),
            )

        console.print(table)
        console.print(f"  [dim]Ângulo: {ideia.get('angulo', '')}[/dim]")
        console.print(f"  [dim]Links: {', '.join(ideia.get('links', [])[:2])}[/dim]")
        console.print()
