import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.suntzu import SUNTZU_PROMPT


class AgenteEstrateguista(BaseAgent):
    name = "estrategista"
    persona = "Sun Tzu"
    system_prompt = SUNTZU_PROMPT

    def execute(self, task: dict) -> dict:
        self.emit("thinking", "Analisando o campo de batalha...")

        relatorio = task.get("relatorio_tendencias", {})
        principios = task.get("principios_do_analista", [])

        user_msg = f"""
Relatório de Tendências recebido do Pesquisador:
{json.dumps(relatorio, ensure_ascii=False, indent=2)}

Princípios do ciclo anterior (Analista):
{json.dumps(principios, ensure_ascii=False, indent=2)}

Analise o campo. Escolha a batalha certa. Entregue o brief.
"""
        resposta = self.think([{"role": "user", "content": user_msg}])
        brief = parse_agent_json(resposta)

        self.emit("completed", f"Batalha escolhida: {brief.get('topico', '?')}", brief)
        return brief
