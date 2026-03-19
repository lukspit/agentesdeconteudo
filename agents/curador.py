import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.munger import MUNGER_PROMPT


class AgenteCurador(BaseAgent):
    name = "curador"
    persona = "Charlie Munger"
    system_prompt = MUNGER_PROMPT

    def execute(self, task: dict) -> dict:
        self.emit("thinking", "Invertendo. O que sobra quando se remove o hype?")

        sinais = task.get("sinais", [])
        historico = task.get("historico_topicos", [])

        user_msg = f"""
Sinais detectados pelo Feynman:
{json.dumps(sinais, ensure_ascii=False, indent=2)}

Tópicos já cobertos anteriormente (evite repetição):
{json.dumps(historico, ensure_ascii=False, indent=2)}

Selecione exatamente 3 ideias. Seja brutal no corte.
"""
        resposta = self.think([{"role": "user", "content": user_msg}])
        curadoria = parse_agent_json(resposta)

        ideias = curadoria.get("ideias", [])
        topicos = [i.get("topico", "?") for i in ideias]
        self.emit("completed", f"3 ideias selecionadas: {', '.join(topicos)}", curadoria)
        return curadoria
