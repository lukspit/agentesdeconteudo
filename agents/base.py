from __future__ import annotations
from openai import OpenAI
from dataclasses import dataclass, field
from typing import Callable, Optional
import config


@dataclass
class AgentMessage:
    de: str
    para: Optional[str]
    tipo: str
    conteudo: str
    dados: dict = field(default_factory=dict)


class EventBus:
    """
    Barramento de eventos central.
    Handlers plugáveis: console agora, WebSocket no futuro.
    """
    def __init__(self):
        self._handlers: list[Callable] = []

    def subscribe(self, handler: Callable):
        self._handlers.append(handler)

    def emit(self, agente: str, tipo: str, mensagem: str, dados: dict = None):
        event = {
            "agente": agente,
            "tipo": tipo,
            "mensagem": mensagem,
            "dados": dados or {},
        }
        for handler in self._handlers:
            handler(event)


# Instância global — todos os agentes usam a mesma
event_bus = EventBus()


class BaseAgent:
    """
    Classe base de todos os agentes.
    Para adicionar um novo agente: extenda esta classe,
    defina name, persona e system_prompt, implemente execute().
    """
    name: str = "base"
    persona: str = "Base"
    model: str = config.DEFAULT_MODEL
    system_prompt: str = ""

    def __init__(self):
        self.client = OpenAI(
            base_url=config.OPENROUTER_BASE_URL,
            api_key=config.OPENROUTER_API_KEY,
        )

    def think(self, messages: list, override_system: str = None) -> str:
        """Chama o modelo com o system prompt da persona."""
        system = override_system or self.system_prompt
        full_messages = [{"role": "system", "content": system}] + messages
        response = self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
        )
        return response.choices[0].message.content

    def emit(self, tipo: str, mensagem: str, dados: Optional[dict] = None):
        event_bus.emit(self.name, tipo, mensagem, dados)

    def execute(self, task: dict) -> dict:
        raise NotImplementedError(f"{self.name} precisa implementar execute()")

    def __repr__(self):
        return f"<Agente: {self.persona} ({self.name})>"
