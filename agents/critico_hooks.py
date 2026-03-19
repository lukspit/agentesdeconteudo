import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.socrates import SOCRATES_PROMPT


class AgenteCriticoHooks(BaseAgent):
    name = "critico_hooks"
    persona = "Sócrates"
    system_prompt = SOCRATES_PROMPT

    def execute(self, task: dict) -> dict:
        self.emit("thinking", "Por que alguém pararia de scrollar aqui? Me convença.")

        pacotes = task.get("pacotes", [])

        user_msg = f"""
Hooks criados pelo Gary Halbert:
{json.dumps(pacotes, ensure_ascii=False, indent=2)}

Questione cada hook. Seja específico — perguntas genéricas não servem.
"""
        resposta = self.think([{"role": "user", "content": user_msg}])
        criticas = parse_agent_json(resposta)

        n_criticas = len(criticas.get("criticas", []))
        self.emit("completed", f"Críticas socráticas para {n_criticas} pacotes de hooks", criticas)
        return criticas
