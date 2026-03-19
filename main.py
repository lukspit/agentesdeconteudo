#!/usr/bin/env python3
"""
Agentes Criadores de Conteúdo
Ponto de entrada principal.

Uso:
  python main.py              ← roda um ciclo completo
  python main.py --dry-run    ← testa sem chamar a API (só coleta dados)
"""
import sys
import json
from orchestrator import rodar_ciclo
from rich.console import Console

console = Console()


def main():
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        console.print("[bold yellow]Modo dry-run: coletando dados sem chamar agentes[/bold yellow]")
        from collectors import github, reddit, twitter
        dados = {
            "github": github.get_trending_repos(limit=5),
            "reddit": reddit.get_hot_posts(limit_per_sub=3),
            "twitter": twitter.get_trending_tweets(limit_per_hashtag=5),
        }
        console.print_json(json.dumps(dados, ensure_ascii=False, indent=2))
        return

    # Ciclo completo
    resultado = rodar_ciclo(dados_performance=None)
    console.print(f"\n[dim]Resultado completo salvo em output/ciclo-{resultado['ciclo_id']}.json[/dim]")


if __name__ == "__main__":
    main()
