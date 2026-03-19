import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.graham import GRAHAM_PROMPT


class AgenteEstrateguistaPauta(BaseAgent):
    name = "estrategista_pauta"
    persona = "Paul Graham"
    system_prompt = GRAHAM_PROMPT

    def execute(self, task: dict) -> dict:
        self.emit("thinking", "Qual é o ângulo que vai fazer a pessoa repensar algo?")

        ideias = task.get("ideias", [])

        user_msg = f"""
As 3 ideias curadas pelo Munger:
{json.dumps(ideias, ensure_ascii=False, indent=2)}

Valide e refine o ângulo de cada uma. O que vai fazer o espectador mudar como pensa sobre isso?
"""
        resposta = self.think([{"role": "user", "content": user_msg}])
        validacao = parse_agent_json(resposta)

        aprovadas = [i for i in validacao.get("ideias_validadas", []) if i.get("aprovado")]
        self.emit("completed", f"{len(aprovadas)}/3 ideias com ângulo validado", validacao)
        return validacao
