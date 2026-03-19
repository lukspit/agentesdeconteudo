"""
Registry central de agentes.

Para adicionar um novo agente:
1. Crie agents/novo_agente.py estendendo BaseAgent
2. Importe aqui
3. Adicione no AGENT_REGISTRY
"""
from agents.pesquisador import AgentePesquisador
from agents.curador import AgenteCurador
from agents.estrategista_pauta import AgenteEstrateguistaPauta
from agents.hook_writer import AgenteHookWriter
from agents.critico_hooks import AgenteCriticoHooks

AGENT_REGISTRY = {
    "pesquisador": AgentePesquisador,
    "curador": AgenteCurador,
    "estrategista_pauta": AgenteEstrateguistaPauta,
    "hook_writer": AgenteHookWriter,
    "critico_hooks": AgenteCriticoHooks,
}


def get_agent(name: str):
    cls = AGENT_REGISTRY.get(name)
    if not cls:
        raise ValueError(f"Agente '{name}' não encontrado. Disponíveis: {list(AGENT_REGISTRY.keys())}")
    return cls()
