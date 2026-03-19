"""
Servidor FastAPI — ponte entre o sistema de agentes e o frontend.

WebSocket /ws      → stream de eventos em tempo real
POST /cycle/start  → dispara um ciclo completo em background thread
GET  /cycle/status → status do ciclo atual
GET  /cycle/latest → output do último ciclo finalizado
"""
import asyncio
import glob
import json
import threading
from contextlib import asynccontextmanager
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# --------------------------------------------------------------------------- #
# Estado global do servidor
# --------------------------------------------------------------------------- #
_loop: Optional[asyncio.AbstractEventLoop] = None
_connections: List[WebSocket] = []
_cycle_running = False
_event_bus_subscribed = False
_cancel_event = threading.Event()


# --------------------------------------------------------------------------- #
# Broadcast para todos os clientes conectados
# --------------------------------------------------------------------------- #
async def _broadcast(event: dict):
    dead = []
    for ws in _connections:
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in _connections:
            _connections.remove(ws)


def sync_emit(event: dict):
    """Chamado de threads síncronas (agentes) — agenda broadcast no loop async."""
    if _loop and _connections:
        asyncio.run_coroutine_threadsafe(_broadcast(event), _loop)


def _ensure_event_bus_subscribed():
    """Garante que sync_emit está inscrito no event_bus. Retry seguro."""
    global _event_bus_subscribed
    if _event_bus_subscribed:
        return
    try:
        from agents.base import event_bus
        event_bus.subscribe(sync_emit)
        _event_bus_subscribed = True
        print("[OK] event_bus conectado ao WebSocket.")
    except Exception as e:
        print(f"[AVISO] event_bus não disponível ainda: {e}")


# --------------------------------------------------------------------------- #
# Lifecycle
# --------------------------------------------------------------------------- #
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _loop
    _loop = asyncio.get_event_loop()
    _ensure_event_bus_subscribed()
    yield  # app rodando


# --------------------------------------------------------------------------- #
# App
# --------------------------------------------------------------------------- #
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# WebSocket
# --------------------------------------------------------------------------- #
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    _connections.append(ws)

    # Envia o status atual imediatamente
    await ws.send_json({
        "agente": "sistema",
        "tipo": "connected",
        "mensagem": "Conectado ao War Room",
        "dados": {"cycle_running": _cycle_running},
    })

    try:
        while True:
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        if ws in _connections:
            _connections.remove(ws)


# --------------------------------------------------------------------------- #
# Endpoints REST
# --------------------------------------------------------------------------- #
@app.post("/cycle/start")
async def start_cycle():
    global _cycle_running

    if _cycle_running:
        return {"status": "already_running"}

    # Seta imediatamente para evitar race condition de cliques duplos
    _cycle_running = True

    _cancel_event.clear()

    def run():
        global _cycle_running
        try:
            # Garante subscription mesmo se servidor iniciou sem API key
            _ensure_event_bus_subscribed()
            from orchestrator import rodar_ciclo, CicloCancelado
            rodar_ciclo(_cancel_event)
        except CicloCancelado:
            sync_emit({
                "agente": "sistema",
                "tipo": "cycle_cancelled",
                "mensagem": "Ciclo cancelado",
                "dados": {},
            })
        except Exception as e:
            sync_emit({
                "agente": "sistema",
                "tipo": "error",
                "mensagem": f"Erro no ciclo: {e}",
                "dados": {},
            })
        finally:
            _cycle_running = False
            sync_emit({
                "agente": "sistema",
                "tipo": "cycle_end",
                "mensagem": "Ciclo finalizado",
                "dados": {},
            })

    threading.Thread(target=run, daemon=True).start()
    return {"status": "started"}


@app.post("/cycle/cancel")
async def cancel_cycle():
    if not _cycle_running:
        return {"status": "not_running"}
    _cancel_event.set()
    return {"status": "cancelled"}


@app.get("/cycle/status")
async def cycle_status():
    return {"running": _cycle_running}


@app.get("/cycle/latest")
async def cycle_latest():
    files = sorted(glob.glob("output/ciclo-*.json"), reverse=True)
    if not files:
        return None
    with open(files[0], encoding="utf-8") as f:
        return json.load(f)


@app.get("/cycles")
async def list_cycles():
    files = sorted(glob.glob("output/ciclo-*.json"), reverse=True)
    result = []
    for path in files:
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            result.append({
                "ciclo_id": data.get("ciclo_id"),
                "ideias_count": len(data.get("ideias", [])),
                "ideias": data.get("ideias", []),
            })
        except Exception:
            pass
    return result


# --------------------------------------------------------------------------- #
# Serve o frontend buildado (produção)
# --------------------------------------------------------------------------- #
try:
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
except Exception:
    pass  # Em dev o Vite serve o frontend direto


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
