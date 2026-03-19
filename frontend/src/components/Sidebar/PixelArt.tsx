/**
 * Pixel art components para a sidebar — sem emojis.
 * Renderizam os sprites definidos em pixelChars.ts em elementos <canvas>.
 */

import { useEffect, useRef } from 'react'
import { CHAR_FRAMES, PALETTE } from '../WarRoom/pixelChars'

// ── Rosto do agente ──────────────────────────────────────────────────────────
// Renderiza as primeiras N linhas do sprite idle do agente (head crop).
// Row 0–4 = hair + face + eyes + mouth — perfecto para um avatar pequeno.

export function PixelCharHead({
  agentId,
  px = 3,
  rows = 5,
}: {
  agentId: string
  px?: number
  rows?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const frames = CHAR_FRAMES[agentId]
    if (!frames) return
    const sprite = frames.idle
    const h = Math.min(rows, sprite.length)
    const w = sprite[0]?.length ?? 8
    canvas.width = w * px
    canvas.height = h * px
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let ri = 0; ri < h; ri++) {
      const row = sprite[ri]
      for (let ci = 0; ci < row.length; ci++) {
        const ch = row[ci]
        if (ch === '_' || ch === ' ') continue
        const hex = PALETTE[ch]
        if (hex === undefined) continue
        ctx.fillStyle = '#' + hex.toString(16).padStart(6, '0')
        ctx.fillRect(ci * px, ri * px, px, px)
      }
    }
  }, [agentId, px, rows])

  return (
    <canvas
      ref={ref}
      width={8 * px}
      height={Math.min(rows, 14) * px}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  )
}

// ── Ícones de tipo de evento ─────────────────────────────────────────────────
// Pixel art 5×5 para cada tipo de evento. Sem emojis.

const ICON_PIXELS: Record<string, number[][]> = {
  // Interrogação — pensando
  thinking: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  // Checkmark — concluído
  completed: [
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  // X — erro
  error: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  // Engrenagem simplificada — trabalhando
  working: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
  ],
  // Triângulo play — início de ciclo
  cycle_start: [
    [1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  // Bandeira — fim de ciclo
  cycle_end: [
    [1, 0, 0, 0, 0],
    [1, 1, 1, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  // Losango — mudança de fase
  phase_change: [
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  // Envelope — mensagem enviada
  message_sent: [
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  // Estrela — conteúdo pronto
  content_ready: [
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0],
  ],
  // Link / corrente — conectado
  connected: [
    [0, 1, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 0],
  ],
  // Sinal — padrão / desconhecido
  signal: [
    [0, 0, 0, 0, 1],
    [0, 0, 1, 0, 1],
    [0, 1, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0],
  ],
}

// Cores alinhadas com a paleta do war room (sem neon)
const ICON_COLORS: Record<string, string> = {
  thinking:     '#4a7898',
  completed:    '#3a7050',
  error:        '#8a3030',
  working:      '#8a6828',
  cycle_start:  '#6040a0',
  cycle_end:    '#3a7050',
  phase_change: '#8a7020',
  message_sent: '#2a7080',
  content_ready:'#8a5828',
  connected:    '#3a7058',
  signal:       '#3a5070',
}

export function PixelTypeIcon({ tipo, px = 2 }: { tipo: string; px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pixels = ICON_PIXELS[tipo] ?? ICON_PIXELS['signal']
  const color = ICON_COLORS[tipo] ?? ICON_COLORS['signal']

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = 5 * px
    canvas.height = 5 * px
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = color
    pixels.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell) ctx.fillRect(ci * px, ri * px, px, px)
      })
    })
  }, [tipo, px, pixels, color])

  return (
    <canvas
      ref={ref}
      width={5 * px}
      height={5 * px}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    />
  )
}

// ── Dot de status (online/offline) ──────────────────────────────────────────
// 4×4 pixels, alinhado com a paleta do war room.

const DOT_ON: number[][] = [
  [0, 1, 1, 0],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [0, 1, 1, 0],
]
const DOT_OFF: number[][] = [
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [0, 1, 1, 0],
]

export function PixelStatusDot({ online, px = 2 }: { online: boolean; px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pixels = online ? DOT_ON : DOT_OFF
  const color = online ? '#3a6a4a' : '#6a2a2a'

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = 4 * px
    canvas.height = 4 * px
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = color
    pixels.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell) ctx.fillRect(ci * px, ri * px, px, px)
      })
    })
  }, [online, px, pixels, color])

  return (
    <canvas
      ref={ref}
      width={4 * px}
      height={4 * px}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    />
  )
}
