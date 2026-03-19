import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.jobs import JOBS_PROMPT


class AgenteCriativo(BaseAgent):
    name = "criativo"
    persona = "Steve Jobs"
    system_prompt = JOBS_PROMPT

    def execute(self, task: dict) -> dict:
        brief = task.get("brief", {})
        criticas = task.get("criticas_socraticas", None)
        iteracao = task.get("iteracao", 1)

        if criticas:
            self.emit("thinking", f"Revisando rascunho (iteração {iteracao}) com as perguntas do Sócrates...")
            user_msg = f"""
Brief do Estrategista:
{json.dumps(brief, ensure_ascii=False, indent=2)}

Perguntas do Sócrates sobre o rascunho anterior:
{json.dumps(criticas, ensure_ascii=False, indent=2)}

Responda às perguntas com ação — melhore o conteúdo. Não explique, mostre.
"""
        else:
            self.emit("thinking", "Criando o primeiro rascunho...")
            user_msg = f"""
Brief do Estrategista:
{json.dumps(brief, ensure_ascii=False, indent=2)}

Crie o conteúdo. Comece pelo hook. Faça algo insanamente bom.
"""

        resposta = self.think([{"role": "user", "content": user_msg}])
        rascunho = parse_agent_json(resposta)

        self.emit("completed", f"Rascunho v{iteracao}: '{rascunho.get('hook', '?')[:60]}'", rascunho)
        return rascunho
