import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.munger import MUNGER_PROMPT


class AgenteAnalista(BaseAgent):
    name = "analista"
    persona = "Charlie Munger"
    system_prompt = MUNGER_PROMPT

    def execute(self, task: dict) -> dict:
        self.emit("thinking", "Invertendo os dados para encontrar a verdade...")

        dados_performance = task.get("dados_performance", [])

        if not dados_performance:
            self.emit("completed", "Sem dados de performance ainda — ciclo inicial")
            return {
                "principios_para_estrategista": [],
                "lacunas_de_conhecimento": ["Primeiro ciclo — sem histórico de performance ainda"]
            }

        user_msg = f"""
Dados de performance dos conteúdos publicados:
{json.dumps(dados_performance, ensure_ascii=False, indent=2)}

Inverta. Encontre os padrões reais. Entregue princípios, não métricas.
"""
        resposta = self.think([{"role": "user", "content": user_msg}])
        analise = parse_agent_json(resposta)

        principios = analise.get("principios_para_estrategista", [])
        self.emit("completed", f"{len(principios)} princípios gerados para o Estrategista", analise)
        return analise
