import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.feynman import FEYNMAN_PROMPT


class AgentePesquisador(BaseAgent):
    name = "pesquisador"
    persona = "Richard Feynman"
    system_prompt = FEYNMAN_PROMPT

    def execute(self, task: dict) -> dict:
        self.emit("thinking", "Vasculhando os dados... o que está realmente se movendo aqui?")

        dados_brutos = task.get("dados_brutos", {})

        user_msg = f"""
Dados coletados da internet neste ciclo:

GitHub Trending:
{json.dumps(dados_brutos.get('github', []), ensure_ascii=False, indent=2)}

Reddit (posts quentes):
{json.dumps(dados_brutos.get('reddit', []), ensure_ascii=False, indent=2)}

Twitter/X (tweets relevantes):
{json.dumps(dados_brutos.get('twitter', []), ensure_ascii=False, indent=2)}

Identifique os sinais reais. Separe o sinal do ruído. O que está genuinamente se movendo agora?
"""
        resposta = self.think([{"role": "user", "content": user_msg}])
        relatorio = parse_agent_json(resposta)

        sinais = relatorio.get("sinais", [])
        self.emit("completed", f"{len(sinais)} sinais detectados", relatorio)
        return relatorio
