import { useAgentEvents } from './hooks/useAgentEvents'
import { WarRoom } from './components/WarRoom/WarRoom'
import { Sidebar } from './components/Sidebar/Sidebar'
import { StatusBar } from './components/StatusBar'

export default function App() {
  // Conecta ao WebSocket e processa eventos
  useAgentEvents()

  return (
    <div className="flex flex-col w-full h-full bg-war-bg text-white select-none">
      {/* Área principal */}
      <div className="flex flex-1 overflow-hidden">
        <WarRoom />
        <Sidebar />
      </div>

      {/* Barra de status */}
      <StatusBar />
    </div>
  )
}
