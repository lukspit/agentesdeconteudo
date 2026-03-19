import json
import re
from json_repair import repair_json


def parse_agent_json(text: str) -> dict:
    """
    Parser robusto de JSON para respostas de LLMs.
    Usa json-repair para lidar com aspas soltas, vírgulas extras, etc.
    """
    if not text or not text.strip():
        raise ValueError("Resposta vazia do modelo")

    # Remove blocos markdown ```json ... ```
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()

    # Tenta parse direto primeiro (mais rápido)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extrai o objeto JSON principal
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"Nenhum JSON encontrado: {text[:200]}")

    json_str = text[start:end]

    # Tenta repair (lida com aspas não escapadas, vírgulas extras, etc.)
    try:
        repaired = repair_json(json_str)
        return json.loads(repaired)
    except Exception as e:
        raise ValueError(f"Falha ao reparar JSON: {e}\nTexto original: {json_str[:300]}")
