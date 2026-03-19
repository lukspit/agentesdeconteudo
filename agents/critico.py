import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.socrates import SOCRATES_PROMPT


class AgenteCritico(BaseAgent):
    name = "critico"
    persona = "Sócrates"
    system_prompt = SOCRATES_PROMPT

    def execute(self, task: dict) -> dict:
        self.emit("thinking", "Examinando as premissas...")

        rascunho = task.get("rascunho", {})
        brief = task.get("brief", {})

        user_msg = f"""
Brief original do Estrategista:
{json.dumps(brief, ensure_ascii=False, indent=2)}

Rascunho criado pelo Criativo:
{json.dumps(rascunho, ensure_ascii=False, indent=2)}

Questione. Não aprove. Não sugira. Apenas pergunte.
"""
        resposta = self.think([{"role": "user", "content": user_msg}])
        criticas = parse_agent_json(resposta)

        perguntas = criticas.get("perguntas", [])
        self.emit("completed", f"{len(perguntas)} perguntas levantadas", criticas)
        return criticas
