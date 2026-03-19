import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.halbert import HALBERT_PROMPT


class AgenteHookWriter(BaseAgent):
    name = "hook_writer"
    persona = "Gary Halbert"
    system_prompt = HALBERT_PROMPT

    def execute(self, task: dict) -> dict:
        ideias = task.get("ideias_validadas", [])
        criticas = task.get("criticas_socraticas", None)
        iteracao = task.get("iteracao", 1)

        if criticas:
            self.emit("thinking", f"Revisando hooks (iteração {iteracao}) com as perguntas do Sócrates...")
            user_msg = f"""
Ideias validadas:
{json.dumps(ideias, ensure_ascii=False, indent=2)}

Perguntas do Sócrates sobre os hooks anteriores:
{json.dumps(criticas, ensure_ascii=False, indent=2)}

Revise os hooks respondendo às perguntas com ação. Não explique — mostre na reescrita.
"""
        else:
            self.emit("thinking", "Criando os hooks... o que faria EU parar de scrollar?")
            user_msg = f"""
Ideias validadas pelo Paul Graham:
{json.dumps(ideias, ensure_ascii=False, indent=2)}

Crie 3 combinações de hook por ideia. Cada uma com estratégia diferente.
Lembre: falado + título + subtítulo trabalham juntos mas não são idênticos.
"""

        resposta = self.think([{"role": "user", "content": user_msg}])
        pacotes = parse_agent_json(resposta)

        n_pacotes = len(pacotes.get("pacotes", []))
        self.emit("completed", f"Hooks criados para {n_pacotes} ideias (v{iteracao})", pacotes)
        return pacotes
