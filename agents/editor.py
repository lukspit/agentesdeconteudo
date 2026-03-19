import json
from agents.base import BaseAgent
from agents.json_parser import parse_agent_json
from prompts.ogilvy import OGILVY_PROMPT


class AgenteEditor(BaseAgent):
    name = "editor"
    persona = "David Ogilvy"
    system_prompt = OGILVY_PROMPT

    def execute(self, task: dict) -> dict:
        self.emit("thinking", "Revisando o copy com atenção cirúrgica...")

        rascunho = task.get("rascunho", {})
        brief = task.get("brief", {})

        user_msg = f"""
Brief original:
{json.dumps(brief, ensure_ascii=False, indent=2)}

Rascunho final do Criativo:
{json.dumps(rascunho, ensure_ascii=False, indent=2)}

Polimento final. Entregue 3 variações de hook e título. Justifique com princípios de copywriting.
"""
        resposta = self.think([{"role": "user", "content": user_msg}])
        conteudo_final = parse_agent_json(resposta)

        self.emit("completed", "Conteúdo polido e pronto para publicação", conteudo_final)
        return conteudo_final
