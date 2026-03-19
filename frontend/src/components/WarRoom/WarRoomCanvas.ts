import * as PIXI from 'pixi.js'
import {
  PALETTE,
  CHAR_FRAMES,
  ZZZ_S, ZZZ_M, ZZZ_L,
  CharDef,
} from './pixelChars'
import { AgentStatus, AGENT_CONFIG } from '../../types/agent'
import type { FlyingMessage } from '../../types/agent'

// ─── Constants ────────────────────────────────────────────────────────────────
export const CANVAS_W = 900
export const CANVAS_H = 560
const PIXEL = 4

const SPR_W = 8 * PIXEL   // 32px
const SPR_H = 14 * PIXEL  // 56px

// ─── Room zone geometry ───────────────────────────────────────────────────────
// Research Lab:   x=0-484,   y=62-235  (Feynman + Munger)
// Strategy Office:x=497-900, y=62-250  (Graham — private, glass partition)
// Central corridor:           y=235-342 (briefing table + circulation)
// Creative Studio:x=0-672,   y=342-524 (Halbert + Sócrates)
// Utility zone:   x=686-900, y=342-524 (WC, coffee, server)
export const ZONE = {
  glassPartX:  486,   // vertical glass wall between Lab and Strategy
  glassPartY1: 62,
  glassPartY2: 235,
  glassDoorY1: 168,   // door opening (characters walk through)
  glassDoorY2: 202,
  solidPartX:  674,   // vertical wall between Studio and Utility
  solidPartY1: 342,
  solidPartY2: 524,
  solidDoorY1: 428,
  solidDoorY2: 460,
}

// Agent home positions: sprite center X, feet Y
const DESK_POS: Record<string, { x: number; y: number }> = {
  pesquisador:        { x: 142, y: 186 },  // Research Lab — left
  curador:            { x: 310, y: 186 },  // Research Lab — right
  estrategista_pauta: { x: 718, y: 178 },  // Strategy Office — solo
  hook_writer:        { x: 172, y: 456 },  // Creative Studio — left
  critico_hooks:      { x: 422, y: 456 },  // Creative Studio — right
}

// Meeting positions around central briefing table
const MEETING_POS: Record<string, { x: number; y: number }> = {
  pesquisador:        { x: 372, y: 270 },
  curador:            { x: 420, y: 260 },
  estrategista_pauta: { x: 472, y: 270 },
  hook_writer:        { x: 398, y: 322 },
  critico_hooks:      { x: 452, y: 314 },
}

// ─── Door waypoints — agents MUST pass through these to cross zone boundaries ─
export const DOORS = {
  labSouth:    { x: 210, y: 237 },  // Research Lab → Corridor
  stratSouth:  { x: 638, y: 252 },  // Strategy Office → Corridor
  studioNorth: { x: 304, y: 344 },  // Creative Studio → Corridor
  glassDoor:   { x: 491, y: 185 },  // Glass partition (Lab ↔ Strategy)
  solidDoor:   { x: 679, y: 444 },  // Solid partition (Studio ↔ Utility)
  wcSpot:      { x: 752, y: 406 },  // Inside WC (toilet/sink area)
}

// Axis to align BEFORE crossing each door (prevents diagonal door-crossing)
// 'x' = horizontal partition: align X-coord with door first, then walk straight through
// 'y' = vertical partition: align Y-coord with door first, then walk straight through
const DOOR_CROSS_AXIS: Record<string, 'x' | 'y'> = {
  labSouth:    'x',
  stratSouth:  'x',
  studioNorth: 'x',
  glassDoor:   'y',
  solidDoor:   'y',
}

// Zone adjacency graph (each edge now carries a name for axis-alignment lookup)
const ZONE_GRAPH: Record<string, Array<{ name: string; door: {x:number;y:number}; next: string }>> = {
  lab:      [{ name: 'labSouth',    door: DOORS.labSouth,    next: 'corridor' },
             { name: 'glassDoor',   door: DOORS.glassDoor,   next: 'strategy' }],
  strategy: [{ name: 'stratSouth',  door: DOORS.stratSouth,  next: 'corridor' },
             { name: 'glassDoor',   door: DOORS.glassDoor,   next: 'lab'      }],
  corridor: [{ name: 'labSouth',    door: DOORS.labSouth,    next: 'lab'      },
             { name: 'stratSouth',  door: DOORS.stratSouth,  next: 'strategy' },
             { name: 'studioNorth', door: DOORS.studioNorth, next: 'studio'   }],
  studio:   [{ name: 'studioNorth', door: DOORS.studioNorth, next: 'corridor' },
             { name: 'solidDoor',   door: DOORS.solidDoor,   next: 'utility'  }],
  utility:  [{ name: 'solidDoor',   door: DOORS.solidDoor,   next: 'studio'   }],
}

function getZone(x: number, y: number): string {
  if (y <= 237 && x < 486)  return 'lab'
  if (y <= 252 && x >= 497) return 'strategy'
  if (y >= 342 && x < 674)  return 'studio'
  if (y >= 342 && x >= 686) return 'utility'
  return 'corridor'
}

/** BFS through zone graph — returns ordered waypoints including final destination.
 *  Inserts an axis-alignment waypoint before each door so agents walk
 *  perpendicular to partitions instead of cutting diagonally through them. */
function planPath(
  fx: number, fy: number,
  tx: number, ty: number
): Array<{ x: number; y: number }> {
  const fromZone = getZone(fx, fy)
  const toZone   = getZone(tx, ty)
  if (fromZone === toZone) return [{ x: tx, y: ty }]

  type DoorWP = { name: string; x: number; y: number }
  type State  = { zone: string; doors: DoorWP[] }
  const queue: State[] = [{ zone: fromZone, doors: [] }]
  const visited = new Set([fromZone])
  let doorSequence: DoorWP[] | null = null

  while (queue.length > 0 && !doorSequence) {
    const { zone, doors } = queue.shift()!
    for (const edge of (ZONE_GRAPH[zone] ?? [])) {
      if (visited.has(edge.next)) continue
      const nextDoors = [...doors, { name: edge.name, x: edge.door.x, y: edge.door.y }]
      if (edge.next === toZone) { doorSequence = nextDoors; break }
      visited.add(edge.next)
      queue.push({ zone: edge.next, doors: nextDoors })
    }
  }

  if (!doorSequence) return [{ x: tx, y: ty }]

  // Build path: insert alignment waypoint before each door crossing
  const result: Array<{ x: number; y: number }> = []
  let prevX = fx, prevY = fy

  for (const door of doorSequence) {
    const axis = DOOR_CROSS_AXIS[door.name] ?? 'x'
    if (axis === 'x') {
      // Horizontal partition: move to door's X first, keeping current Y
      if (Math.abs(door.x - prevX) > 8) result.push({ x: door.x, y: prevY })
    } else {
      // Vertical partition: move to door's Y first, keeping current X
      if (Math.abs(door.y - prevY) > 8) result.push({ x: prevX, y: door.y })
    }
    result.push({ x: door.x, y: door.y })
    prevX = door.x; prevY = door.y
  }

  result.push({ x: tx, y: ty })
  return result
}

// ─── Room colors ──────────────────────────────────────────────────────────────
const C = {
  floorA:  0x8b7355,
  floorB:  0x7a6445,
  plank:   0x5c4a30,
  wallN:   0x1e2d48,
  wallS:   0x1a2640,
  trim:    0x2c4068,
  deskTop: 0x4a6880,
  deskFrt: 0x2e4a68,
  deskEdg: 0x1e3a56,
  monBack: 0x141420,
  monOff:  0x080e18,
  monOn:   0x003a7a,
  monLine: 0x0066bb,
  chair:   0x3a2c1e,
  chairLt: 0x4e3a28,
  tableTop:0x3a5c3a,
  tableFrt:0x2a4c2a,
  tableEdg:0x1e3c1e,
  plant:   0x2a6030,
  plantDk: 0x1e4822,
  pot:     0x8a5a34,
  shelf:   0x6a4a28,
  bkR:     0xcc3333,
  bkB:     0x3355cc,
  bkG:     0x33aa44,
  bkY:     0xccaa22,
  wbSurf:  0xe0e0d8,
  wbFrame: 0x7a7a6a,
  coffee:  0x4a3018,
  rug1:    0x2a1a40,
  rug2:    0x3a2a50,
  // Zone-specific
  execFlrA: 0x5a3a20,  // mahogany plank A (strategy office)
  execFlrB: 0x4a2e18,  // mahogany plank B
  execPlank:0x3a2010,  // plank joint
  tileW:    0xd8d8d0,  // WC tile white
  tileG:    0xb0b0a8,  // WC tile gray
  glass:    0x3a6a8a,  // glass partition tint
  glassLine:0x5a8aaa,  // glass divider
  wallSolid:0x1a2430,  // solid internal wall
  wallFront:0x141c28,  // wall front face
  baseboard: 0x2a3a54, // zone baseboard trim
}

// ─── Floor ────────────────────────────────────────────────────────────────────
function drawFloor(stage: PIXI.Container) {
  const g = new PIXI.Graphics()
  // Base
  g.beginFill(C.floorA)
  g.drawRect(0, 62, CANVAS_W, CANVAS_H - 62)
  g.endFill()
  // Alternating rows
  for (let row = 0; row < 18; row++) {
    const y = 62 + row * 28
    if (row % 2 === 1) {
      g.beginFill(C.floorB, 0.38)
      g.drawRect(0, y, CANVAS_W, 28)
      g.endFill()
    }
    // Horizontal plank lines
    g.lineStyle(1, C.plank, 0.4)
    g.moveTo(0, y)
    g.lineTo(CANVAS_W, y)
    // Vertical joints (offset per row)
    g.lineStyle(1, C.plank, 0.22)
    const off = (row % 3) * 46
    for (let x = off; x < CANVAS_W; x += 140) {
      g.moveTo(x, y)
      g.lineTo(x, y + 28)
    }
  }
  g.lineStyle(0)
  stage.addChild(g)
}

// ─── Central rug (fills the meeting zone nicely) ───────────────────────────
function drawRug(stage: PIXI.Container) {
  const g = new PIXI.Graphics()
  // Corridor rug — lives between the north zone (y≈235) and south zone (y≈342)
  g.lineStyle(4, C.rug2, 0.7)
  g.beginFill(C.rug1, 0.35)
  g.drawRoundedRect(268, 237, 348, 132, 10)
  g.endFill()
  // Inner border
  g.lineStyle(2, C.rug2, 0.5)
  g.drawRoundedRect(280, 249, 324, 108, 7)
  g.lineStyle(0)
  stage.addChild(g)
}

// ─── Walls ────────────────────────────────────────────────────────────────────
function drawTopWall(stage: PIXI.Container) {
  const g = new PIXI.Graphics()
  g.beginFill(C.wallN)
  g.drawRect(0, 0, CANVAS_W, 62)
  g.endFill()
  // Baseboard
  g.beginFill(C.trim)
  g.drawRect(0, 56, CANVAS_W, 6)
  g.endFill()
  // Windows
  ;[155, 450, 748].forEach((wx) => {
    // Frame
    g.beginFill(0x3a5070)
    g.drawRect(wx - 32, 5, 64, 46)
    g.endFill()
    // Glass
    g.beginFill(0x6aafd8, 0.5)
    g.drawRect(wx - 28, 8, 56, 40)
    g.endFill()
    // Cross dividers
    g.lineStyle(2, 0x3a5070, 0.9)
    g.moveTo(wx, 8); g.lineTo(wx, 48)
    g.moveTo(wx - 28, 28); g.lineTo(wx + 28, 28)
    g.lineStyle(0)
    // Highlight
    g.beginFill(0xffffff, 0.06)
    g.drawRect(wx - 28, 8, 28, 20)
    g.endFill()
    // Outside glow
    g.beginFill(0xffeecc, 0.05)
    g.drawRect(wx - 36, 48, 72, 22)
    g.endFill()
  })
  // Ceiling lamps
  ;[80, 305, 530, 756].forEach((lx) => {
    g.beginFill(0xd4aa30, 0.55)
    g.drawRect(lx, 54, 80, 3)
    g.endFill()
    g.beginFill(0xffee88, 0.07)
    g.drawRect(lx - 15, 57, 110, 28)
    g.endFill()
  })
  stage.addChild(g)
}

function drawBottomWall(stage: PIXI.Container) {
  const g = new PIXI.Graphics()
  g.beginFill(C.wallS)
  g.drawRect(0, 524, CANVAS_W, 36)
  g.endFill()
  g.beginFill(C.trim)
  g.drawRect(0, 524, CANVAS_W, 5)
  g.endFill()
  // Two small windows
  ;[220, 700].forEach((wx) => {
    g.beginFill(0x2a4060)
    g.drawRect(wx - 28, 530, 56, 26)
    g.endFill()
    g.beginFill(0x5a8fb0, 0.4)
    g.drawRect(wx - 24, 533, 48, 20)
    g.endFill()
    g.lineStyle(1, 0x2a4060, 0.8)
    g.moveTo(wx, 533); g.lineTo(wx, 553)
    g.moveTo(wx - 24, 543); g.lineTo(wx + 24, 543)
    g.lineStyle(0)
  })
  stage.addChild(g)
}

// ─── Desk base (shared) ───────────────────────────────────────────────────────
function drawDeskBase(g: PIXI.Graphics, cx: number, ty: number) {
  const W = 78, surf = 14, front = 24

  // Shadow
  g.beginFill(0x000000, 0.2)
  g.drawRect(cx - W / 2 + 4, ty + surf + front, W - 4, 8)
  g.endFill()
  // Front face
  g.beginFill(C.deskFrt)
  g.drawRect(cx - W / 2, ty + surf, W, front)
  g.endFill()
  // Top surface
  g.beginFill(C.deskTop)
  g.drawRect(cx - W / 2, ty, W, surf)
  g.endFill()
  // Edge
  g.lineStyle(1, C.deskEdg, 0.8)
  g.drawRect(cx - W / 2, ty, W, surf + front)
  g.lineStyle(0)
  // Chair
  g.beginFill(C.chair)
  g.drawRoundedRect(cx - 16, ty + surf + front + 2, 32, 17, 3)
  g.endFill()
  g.beginFill(C.chairLt, 0.5)
  g.drawRoundedRect(cx - 13, ty + surf + front + 4, 26, 8, 2)
  g.endFill()
  // Chair back (small panel above)
  g.beginFill(C.chair)
  g.drawRect(cx - 8, ty + surf + front - 6, 16, 9)
  g.endFill()
}

// ─── Personalized desk items ──────────────────────────────────────────────────

// Feynman: physics formulas, chalkboard square, coffee ring stain, tiny telescope
function deskFeynman(g: PIXI.Graphics, cx: number, ty: number) {
  // Mini blackboard
  g.beginFill(0x1a2a1a)
  g.drawRect(cx - 36, ty - 38, 28, 20)
  g.endFill()
  g.lineStyle(1, 0x3a6a3a, 0.8)
  g.drawRect(cx - 36, ty - 38, 28, 20)
  g.lineStyle(0)
  // Chalk squiggle (formula ~E=mc²)
  g.lineStyle(1, 0xcccccc, 0.7)
  g.moveTo(cx - 34, ty - 30)
  g.lineTo(cx - 29, ty - 30)
  g.moveTo(cx - 27, ty - 30)
  g.lineTo(cx - 20, ty - 22)
  g.moveTo(cx - 18, ty - 30)
  g.lineTo(cx - 13, ty - 30)
  g.lineStyle(0)
  // Paper with equations
  g.beginFill(0xddd8c0, 0.75)
  g.drawRect(cx + 6, ty + 1, 20, 12)
  g.endFill()
  g.lineStyle(1, 0x998866, 0.35)
  for (let i = 0; i < 3; i++) { g.moveTo(cx + 8, ty + 3 + i * 4); g.lineTo(cx + 24, ty + 3 + i * 4) }
  g.lineStyle(0)
  // Tiny telescope
  g.beginFill(0x8a6a3a)
  g.drawRect(cx - 14, ty + 2, 16, 5)
  g.endFill()
  g.beginFill(0xaa8850)
  g.drawRect(cx - 17, ty + 3, 5, 4)
  g.endFill()
  // Coffee mug + ring stain on surface
  g.beginFill(0xe0cca0)
  g.drawRect(cx + 28, ty + 2, 8, 10)
  g.endFill()
  g.beginFill(0x6b3a1f)
  g.drawRect(cx + 29, ty + 3, 6, 7)
  g.endFill()
  g.lineStyle(1, 0x7a4a28, 0.25)
  g.drawCircle(cx + 32, ty + 13, 6)
  g.lineStyle(0)
}

// Munger: dual monitors, stack of reports, chess piece, calculator
function deskMunger(g: PIXI.Graphics, cx: number, ty: number) {
  // Second (left) monitor
  g.beginFill(C.monBack)
  g.drawRect(cx - 40, ty - 30, 20, 26)
  g.endFill()
  g.beginFill(C.monOn, 0.75)
  g.drawRect(cx - 38, ty - 28, 16, 20)
  g.endFill()
  // Report stack
  g.beginFill(0xddccaa)
  g.drawRect(cx + 14, ty + 1, 22, 12)
  g.endFill()
  g.beginFill(0xccc0aa)
  g.drawRect(cx + 15, ty - 1, 20, 12)
  g.endFill()
  g.beginFill(0xbbaa88)
  g.drawRect(cx + 16, ty - 3, 18, 12)
  g.endFill()
  // Chess piece (rook shape)
  g.beginFill(0xe8e8d8)
  g.drawRect(cx + 34, ty + 1, 6, 10)
  g.endFill()
  g.beginFill(0xe8e8d8)
  g.drawRect(cx + 33, ty + 9, 8, 3)
  g.endFill()
  g.beginFill(0xe8e8d8)
  g.drawRect(cx + 33, ty + 1, 2, 4)
  g.endFill()
  g.beginFill(0xe8e8d8)
  g.drawRect(cx + 39, ty + 1, 2, 4)
  g.endFill()
  // Calculator
  g.beginFill(0x2a2a2a)
  g.drawRoundedRect(cx - 36, ty + 2, 16, 10, 1)
  g.endFill()
  g.beginFill(0x44ffaa, 0.6)
  g.drawRect(cx - 34, ty + 3, 12, 4)
  g.endFill()
}

// Graham: large wall chart, sticky notes, planner, trend arrow
function deskGraham(g: PIXI.Graphics, cx: number, ty: number) {
  // Wall chart (taped above desk)
  g.beginFill(0xeeeedd)
  g.drawRect(cx - 38, ty - 42, 32, 26)
  g.endFill()
  g.lineStyle(1, 0xbbaa88, 0.5)
  g.drawRect(cx - 38, ty - 42, 32, 26)
  g.lineStyle(0)
  // Trend line going up
  g.lineStyle(2, 0x44aa44, 0.8)
  g.moveTo(cx - 35, ty - 20)
  g.lineTo(cx - 25, ty - 28)
  g.lineTo(cx - 15, ty - 24)
  g.lineTo(cx - 8,  ty - 34)
  g.lineStyle(0)
  // Arrow tip
  g.beginFill(0x44aa44)
  g.drawPolygon([cx - 8, ty - 38, cx - 4, ty - 33, cx - 12, ty - 33])
  g.endFill()
  // Sticky notes (3 yellow squares)
  ;[[cx + 10, ty + 1], [cx + 20, ty - 1], [cx + 30, ty + 2]].forEach(([sx, sy]) => {
    g.beginFill(0xffee44, 0.8)
    g.drawRect(sx, sy, 10, 9)
    g.endFill()
    g.lineStyle(1, 0xddcc22, 0.35)
    g.moveTo(sx + 2, sy + 3); g.lineTo(sx + 8, sy + 3)
    g.lineStyle(0)
  })
  // Planner/notebook
  g.beginFill(0x3355aa)
  g.drawRect(cx - 36, ty + 2, 18, 12)
  g.endFill()
  g.lineStyle(1, 0x224488, 0.8)
  g.moveTo(cx - 27, ty + 2); g.lineTo(cx - 27, ty + 14)
  g.lineStyle(0)
}

// Halbert: crumpled paper balls, massive notepad, quill/pen, red pen lines
function deskHalbert(g: PIXI.Graphics, cx: number, ty: number) {
  // Crumpled paper balls (on floor near desk)
  ;[[cx - 30, ty + 50], [cx - 20, ty + 56], [cx + 24, ty + 52]].forEach(([bx, by]) => {
    g.beginFill(0xddd8cc, 0.65)
    g.drawCircle(bx, by, 5)
    g.endFill()
    g.lineStyle(1, 0xaaa890, 0.3)
    g.drawCircle(bx, by, 4)
    g.lineStyle(0)
  })
  // Big notepad
  g.beginFill(0xf5f0e0)
  g.drawRect(cx - 36, ty + 1, 30, 12)
  g.endFill()
  g.lineStyle(1, 0xddccaa, 0.5)
  g.moveTo(cx - 34, ty + 4); g.lineTo(cx - 8, ty + 4)
  g.moveTo(cx - 34, ty + 8); g.lineTo(cx - 10, ty + 8)
  g.lineStyle(0)
  // Red strokes (editing)
  g.lineStyle(1, 0xee3333, 0.7)
  g.moveTo(cx - 33, ty + 4); g.lineTo(cx - 22, ty + 4)
  g.moveTo(cx - 30, ty + 8); g.lineTo(cx - 18, ty + 8)
  g.lineStyle(0)
  // Quill pen
  g.lineStyle(2, 0x8a7a50, 0.8)
  g.moveTo(cx + 18, ty - 2)
  g.lineTo(cx + 8, ty + 12)
  g.lineStyle(0)
  g.beginFill(0xccbb88)
  g.drawPolygon([cx + 18, ty - 6, cx + 22, ty - 4, cx + 19, ty])
  g.endFill()
  // Ink bottle
  g.beginFill(0x1a1a44)
  g.drawRect(cx + 26, ty + 2, 8, 10)
  g.endFill()
  g.beginFill(0x2222aa, 0.5)
  g.drawRect(cx + 27, ty + 3, 6, 7)
  g.endFill()
}

// Sócrates: scroll/parchment, red correction marks, philosophical tome, goblet
function deskSocrates(g: PIXI.Graphics, cx: number, ty: number) {
  // Large parchment scroll (unrolled)
  g.beginFill(0xeedd99, 0.85)
  g.drawRect(cx - 36, ty + 1, 38, 12)
  g.endFill()
  // Scroll end rolls
  g.beginFill(0xddbb77)
  g.drawCircle(cx - 36, ty + 7, 5)
  g.endFill()
  g.beginFill(0xddbb77)
  g.drawCircle(cx + 2, ty + 7, 5)
  g.endFill()
  // Red correction slashes across scroll
  g.lineStyle(1, 0xcc2222, 0.75)
  g.moveTo(cx - 34, ty + 3); g.lineTo(cx - 10, ty + 11)
  g.moveTo(cx - 26, ty + 3); g.lineTo(cx - 2, ty + 11)
  g.lineStyle(0)
  // Philosophical tome (thick book, leaning on stand)
  g.beginFill(0x5544aa)
  g.drawRect(cx + 16, ty - 36, 12, 38)
  g.endFill()
  g.beginFill(0x4433aa)
  g.drawRect(cx + 17, ty - 34, 10, 36)
  g.endFill()
  g.lineStyle(1, 0x8877cc, 0.5)
  g.moveTo(cx + 22, ty - 30); g.lineTo(cx + 22, ty - 20)
  g.lineStyle(0)
  // Goblet (chalice shape)
  g.beginFill(0xddaa33)
  g.drawRect(cx + 30, ty + 2, 6, 10)
  g.endFill()
  g.beginFill(0xddaa33)
  g.drawRect(cx + 28, ty + 10, 10, 3)
  g.endFill()
  g.beginFill(0xddaa33)
  g.drawRect(cx + 27, ty + 12, 12, 2)
  g.endFill()
  // Wine
  g.beginFill(0x880022, 0.7)
  g.drawRect(cx + 31, ty + 3, 4, 5)
  g.endFill()
}

// ─── Full desk (base + monitor + personalized items) ──────────────────────────
function drawDesk(stage: PIXI.Container, cx: number, ty: number, agentId: string) {
  const g = new PIXI.Graphics()
  drawDeskBase(g, cx, ty)

  // Monitor (center, shared)
  g.beginFill(C.monBack)
  g.drawRect(cx - 14, ty - 36, 28, 37)
  g.endFill()
  g.beginFill(C.monOn, 0.8)
  g.drawRect(cx - 12, ty - 34, 24, 28)
  g.endFill()
  g.lineStyle(1, C.monLine, 0.3)
  for (let ly = ty - 32; ly < ty - 8; ly += 6) {
    g.moveTo(cx - 10, ly); g.lineTo(cx + 10, ly)
  }
  g.lineStyle(0)
  // Keyboard
  g.beginFill(0x2a3848, 0.75)
  g.drawRect(cx - 20, ty + 2, 40, 10)
  g.endFill()

  // Personalized items
  switch (agentId) {
    case 'pesquisador':        deskFeynman(g, cx, ty);   break
    case 'curador':            deskMunger(g, cx, ty);    break
    case 'estrategista_pauta': deskGraham(g, cx, ty);    break
    case 'hook_writer':        deskHalbert(g, cx, ty);   break
    case 'critico_hooks':      deskSocrates(g, cx, ty);  break
  }

  stage.addChild(g)
}

// ─── Meeting table ────────────────────────────────────────────────────────────
function drawMeetingTable(stage: PIXI.Container) {
  const cx = 450, ty = 260, W = 178, surf = 18, front = 30
  const g = new PIXI.Graphics()

  // Shadow
  g.beginFill(0x000000, 0.22)
  g.drawEllipse(cx, ty + surf + front + 9, W / 2 + 10, 12)
  g.endFill()
  // Front face
  g.beginFill(C.tableFrt)
  g.drawRoundedRect(cx - W / 2, ty + surf, W, front, 2)
  g.endFill()
  // Top surface
  g.beginFill(C.tableTop)
  g.drawRoundedRect(cx - W / 2, ty, W, surf, 4)
  g.endFill()
  // Edge
  g.lineStyle(1, C.tableEdg, 0.8)
  g.drawRoundedRect(cx - W / 2, ty, W, surf + front, 4)
  g.lineStyle(0)

  // Surface items
  // Coffee mugs (x2)
  ;[cx - 30, cx + 22].forEach((mx) => {
    g.beginFill(0xe0d4c0); g.drawRect(mx, ty + 3, 8, 10); g.endFill()
    g.beginFill(0x5a2e0e); g.drawRect(mx + 1, ty + 4, 6, 7); g.endFill()
  })
  // Papers
  g.beginFill(0xe0d8cc, 0.8); g.drawRect(cx - 14, ty + 2, 28, 14); g.endFill()
  g.lineStyle(1, 0xaaa090, 0.3)
  ;[ty + 6, ty + 10].forEach((ly) => { g.moveTo(cx - 11, ly); g.lineTo(cx + 11, ly) })
  g.lineStyle(0)
  // Laptop
  g.beginFill(0x2a3a50); g.drawRect(cx + 38, ty + 2, 26, 14); g.endFill()
  g.beginFill(C.monOn, 0.5); g.drawRect(cx + 40, ty + 4, 22, 10); g.endFill()

  // Label
  const lbl = new PIXI.Text('BRIEFING TABLE', {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 4,
    fill: 0x4a8a4a,
  })
  lbl.anchor.set(0.5, 0)
  lbl.x = cx
  lbl.y = ty + surf + front + 13
  stage.addChild(g)
  stage.addChild(lbl)
}

// ─── Props ────────────────────────────────────────────────────────────────────
function drawPlant(stage: PIXI.Container, x: number, y: number, big = false) {
  const g = new PIXI.Graphics()
  const s = big ? 1.3 : 1
  g.beginFill(C.pot); g.drawRect(x - 10 * s, y, 20 * s, 17 * s); g.endFill()
  g.beginFill(0xaa7a4a); g.drawRect(x - 12 * s, y - 4 * s, 24 * s, 6 * s); g.endFill()
  g.beginFill(0x3a5028); g.drawRect(x - 2, y - 16 * s, 4, 16 * s); g.endFill()
  g.beginFill(C.plant); g.drawCircle(x, y - 22 * s, 13 * s); g.endFill()
  g.beginFill(C.plantDk); g.drawCircle(x - 12 * s, y - 17 * s, 9 * s); g.endFill()
  g.beginFill(C.plantDk); g.drawCircle(x + 12 * s, y - 17 * s, 9 * s); g.endFill()
  stage.addChild(g)
}

function drawBookshelf(stage: PIXI.Container, x: number, y: number) {
  const g = new PIXI.Graphics()
  const W = 60, H = 66
  g.beginFill(C.shelf); g.drawRect(x, y, W, H); g.endFill()
  g.beginFill(0x9a7a50)
  g.drawRect(x, y + 20, W, 3)
  g.drawRect(x, y + 43, W, 3)
  g.endFill()
  // Row 1
  ;[[2,7,C.bkR],[10,5,C.bkB],[16,8,C.bkG],[25,5,C.bkR],[31,7,C.bkY],[39,5,C.bkB],[45,8,C.bkG]].forEach(([bx,bw,bc]) => {
    g.beginFill(bc as number); g.drawRect(x + (bx as number), y + 2, bw as number, 17); g.endFill()
  })
  // Row 2
  ;[[2,8,C.bkG],[11,6,C.bkR],[18,7,C.bkB],[26,5,C.bkY],[32,8,C.bkR],[41,6,C.bkG]].forEach(([bx,bw,bc]) => {
    g.beginFill(bc as number); g.drawRect(x + (bx as number), y + 24, bw as number, 18); g.endFill()
  })
  g.lineStyle(1, 0x4a3418, 0.8); g.drawRect(x, y, W, H); g.lineStyle(0)
  stage.addChild(g)
}

function drawWhiteboard(stage: PIXI.Container, x: number, y: number) {
  const g = new PIXI.Graphics()
  const W = 94, H = 58
  g.beginFill(C.wbFrame); g.drawRect(x - 4, y - 4, W + 8, H + 8); g.endFill()
  g.beginFill(C.wbSurf); g.drawRect(x, y, W, H); g.endFill()
  // Boxes and arrows
  g.lineStyle(1, 0x4466aa, 0.65)
  g.drawRect(x + 6, y + 8, 22, 12)
  g.drawRect(x + 4, y + 32, 26, 12)
  g.drawRect(x + 55, y + 30, 20, 14)
  g.moveTo(x + 17, y + 20); g.lineTo(x + 17, y + 32)
  g.moveTo(x + 30, y + 38); g.lineTo(x + 55, y + 37)
  g.lineStyle(1, 0x888080, 0.4)
  ;[8, 14, 20, 26].forEach((oy) => { g.moveTo(x + 34, y + oy); g.lineTo(x + 88, y + oy) })
  g.lineStyle(0)
  const c = new PIXI.Container()
  c.addChild(g)
  const lbl = new PIXI.Text('ROADMAP', { fontFamily: '"Press Start 2P", monospace', fontSize: 4, fill: 0x5577aa })
  lbl.x = x + 2; lbl.y = y + 2
  c.addChild(lbl)
  stage.addChild(c)
}

function drawCoffeeMachine(stage: PIXI.Container, x: number, y: number) {
  const g = new PIXI.Graphics()
  g.beginFill(C.coffee); g.drawRoundedRect(x, y, 28, 38, 4); g.endFill()
  g.beginFill(0x2e1c08, 0.8); g.drawRect(x + 3, y + 3, 22, 22); g.endFill()
  g.beginFill(0x00ff88); g.drawCircle(x + 9, y + 9, 2); g.endFill()
  g.beginFill(0xff4400); g.drawCircle(x + 19, y + 9, 2); g.endFill()
  g.beginFill(0x5a3a20); g.drawCircle(x + 14, y + 18, 5); g.endFill()
  g.beginFill(0x4a3018); g.drawRect(x + 4, y + 28, 20, 8); g.endFill()
  g.beginFill(0xf0e0d0); g.drawRect(x + 10, y + 28, 8, 7); g.endFill()
  g.beginFill(0x5a2e0e); g.drawRect(x + 11, y + 29, 6, 5); g.endFill()
  stage.addChild(g)
}

function drawServerRack(stage: PIXI.Container, x: number, y: number) {
  const g = new PIXI.Graphics()
  // Frame
  g.beginFill(0x1a1a1a)
  g.drawRect(x, y, 50, 60)
  g.endFill()
  g.lineStyle(1, 0x333333, 0.8)
  g.drawRect(x, y, 50, 60)
  g.lineStyle(0)
  // Rack units
  ;[0, 1, 2, 3, 4].forEach((i) => {
    const ry = y + 4 + i * 11
    g.beginFill(0x2a2a2a); g.drawRect(x + 3, ry, 44, 9); g.endFill()
    // LED
    const led = i % 3 === 0 ? 0x00ff44 : i % 3 === 1 ? 0x0066ff : 0xff6600
    g.beginFill(led); g.drawRect(x + 6, ry + 3, 3, 3); g.endFill()
    // Drive bays
    ;[0, 1, 2].forEach((d) => {
      g.beginFill(0x1a1a1a); g.drawRect(x + 14 + d * 9, ry + 2, 7, 5); g.endFill()
    })
  })
  const lbl = new PIXI.Text('SERVER', { fontFamily: '"Press Start 2P", monospace', fontSize: 3, fill: 0x004400 })
  lbl.x = x + 10; lbl.y = y + 62
  stage.addChild(g)
  stage.addChild(lbl)
}

// ─── Zone-specific floors ─────────────────────────────────────────────────────
function drawZoneFloors(stage: PIXI.Container) {
  const g = new PIXI.Graphics()

  // ── Strategy Office: dark mahogany planks (vertical = perpendicular to lab) ──
  const sx = ZONE.glassPartX + 11, sy = ZONE.glassPartY1
  const sw = CANVAS_W - sx, sh = ZONE.glassPartY2 - sy + 15
  g.beginFill(C.execFlrA)
  g.drawRect(sx, sy, sw, sh)
  g.endFill()
  // Plank rows (vertical planks — different direction from corridor)
  for (let col = 0; col < 22; col++) {
    const x = sx + col * 20
    if (col % 2 === 1) {
      g.beginFill(C.execFlrB, 0.4)
      g.drawRect(x, sy, 20, sh)
      g.endFill()
    }
    g.lineStyle(1, C.execPlank, 0.45)
    g.moveTo(x, sy); g.lineTo(x, sy + sh)
  }
  // Horizontal joints (every ~70px)
  g.lineStyle(1, C.execPlank, 0.25)
  for (let jy = sy; jy < sy + sh; jy += 68) {
    g.moveTo(sx, jy); g.lineTo(sx + sw, jy)
  }
  g.lineStyle(0)

  // ── Strategy Office border trim (bottom edge, door gap at x=618-658) ────────
  const sdx = 618, sdw = 40
  g.beginFill(C.baseboard)
  g.drawRect(sx, sy + sh, sdx - sx, 5)
  g.drawRect(sdx + sdw, sy + sh, (sx + sw) - (sdx + sdw), 5)
  g.endFill()
  g.beginFill(0x2a3a4a)
  g.drawRect(sdx - 3, sy + sh - 5, 4, 11)
  g.drawRect(sdx + sdw - 1, sy + sh - 5, 4, 11)
  g.endFill()

  // ── Research Lab bottom baseboard (door gap at x=190-230) ────────────────
  const ldx = 190, ldw = 40
  g.beginFill(C.baseboard)
  g.drawRect(0, ZONE.glassPartY2, ldx, 5)
  g.drawRect(ldx + ldw, ZONE.glassPartY2, ZONE.glassPartX - ldx - ldw, 5)
  g.endFill()
  g.beginFill(0x2a3a4a)
  g.drawRect(ldx - 3, ZONE.glassPartY2 - 5, 4, 11)
  g.drawRect(ldx + ldw - 1, ZONE.glassPartY2 - 5, 4, 11)
  g.endFill()

  // ── WC floor: checkerboard tiles ──────────────────────────────────────────
  const ux = ZONE.solidPartX + 12, uy = ZONE.solidPartY1
  const uw = CANVAS_W - ux, uh = ZONE.solidPartY2 - uy
  const ts = 10  // tile size
  for (let row = 0; row < Math.ceil(uh / ts); row++) {
    for (let col = 0; col < Math.ceil(uw / ts); col++) {
      const even = (row + col) % 2 === 0
      g.beginFill(even ? C.tileW : C.tileG, 0.9)
      g.drawRect(ux + col * ts, uy + row * ts, ts, ts)
      g.endFill()
    }
  }
  // Tile grout lines
  g.lineStyle(1, 0x9a9a92, 0.35)
  for (let row = 0; row <= Math.ceil(uh / ts); row++) {
    g.moveTo(ux, uy + row * ts); g.lineTo(ux + uw, uy + row * ts)
  }
  for (let col = 0; col <= Math.ceil(uw / ts); col++) {
    g.moveTo(ux + col * ts, uy); g.lineTo(ux + col * ts, uy + uh)
  }
  g.lineStyle(0)

  // ── Creative Studio top baseboard (door gap at x=284-324) ───────────────
  const stdx = 284, stdw = 40
  g.beginFill(C.baseboard)
  g.drawRect(0, ZONE.solidPartY1, stdx, 5)
  g.drawRect(stdx + stdw, ZONE.solidPartY1, ZONE.solidPartX - stdx - stdw, 5)
  g.endFill()
  g.beginFill(0x2a3a4a)
  g.drawRect(stdx - 3, ZONE.solidPartY1 - 5, 4, 11)
  g.drawRect(stdx + stdw - 1, ZONE.solidPartY1 - 5, 4, 11)
  g.endFill()

  stage.addChild(g)
}

// ─── Glass + solid partition walls ───────────────────────────────────────────
function drawPartitionWalls(stage: PIXI.Container) {
  const g = new PIXI.Graphics()

  // ── Glass partition (Research Lab ↔ Strategy Office) ─────────────────────
  const gx = ZONE.glassPartX
  const segments: Array<[number, number]> = [
    [ZONE.glassPartY1, ZONE.glassDoorY1],   // above door
    [ZONE.glassDoorY2, ZONE.glassPartY2],   // below door
  ]
  segments.forEach(([y1, y2]) => {
    const h = y2 - y1
    // Frame
    g.beginFill(0x2a3a4a)
    g.drawRect(gx, y1, 11, h)
    g.endFill()
    // Glass fill (frosted tint)
    g.beginFill(C.glass, 0.18)
    g.drawRect(gx + 2, y1, 7, h)
    g.endFill()
    // Panel dividers (horizontal lines every 36px through the glass)
    g.lineStyle(1, C.glassLine, 0.55)
    for (let dy = y1 + 18; dy < y2; dy += 36) {
      g.moveTo(gx + 2, dy); g.lineTo(gx + 9, dy)
    }
    g.lineStyle(0)
  })

  // Door frame outline
  g.lineStyle(2, 0x2a3a4a, 0.9)
  g.moveTo(gx, ZONE.glassDoorY1); g.lineTo(gx, ZONE.glassDoorY2)
  g.moveTo(gx + 10, ZONE.glassDoorY1); g.lineTo(gx + 10, ZONE.glassDoorY2)
  g.lineStyle(0)

  // Door handle (tiny pixel art on glass door)
  g.beginFill(0xc0b080)
  g.drawRect(gx + 2, (ZONE.glassDoorY1 + ZONE.glassDoorY2) / 2, 6, 2)
  g.endFill()

  // "STRATEGY OFFICE" door label above door gap
  const stratLbl = new PIXI.Text('STRATEGY\nOFFICE', {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 4,
    fill: C.glassLine,
    align: 'center',
  })
  stratLbl.anchor.set(0.5, 1)
  stratLbl.x = gx + 5
  stratLbl.y = ZONE.glassDoorY1 - 4
  stage.addChild(stratLbl)

  // ── Solid partition (Creative Studio ↔ Utility) ───────────────────────────
  const wx = ZONE.solidPartX
  const wallSegs: Array<[number, number]> = [
    [ZONE.solidPartY1, ZONE.solidDoorY1],
    [ZONE.solidDoorY2, ZONE.solidPartY2],
  ]
  wallSegs.forEach(([y1, y2]) => {
    const h = y2 - y1
    // Wall top surface (seen from above)
    g.beginFill(C.wallSolid)
    g.drawRect(wx, y1, 12, h)
    g.endFill()
    // Front face edge (small 3px strip giving depth)
    g.beginFill(C.wallFront)
    g.drawRect(wx + 12, y1, 3, h)
    g.endFill()
  })

  // Door frame
  g.lineStyle(2, C.wallSolid, 0.9)
  g.moveTo(wx, ZONE.solidDoorY1); g.lineTo(wx, ZONE.solidDoorY2)
  g.moveTo(wx + 14, ZONE.solidDoorY1); g.lineTo(wx + 14, ZONE.solidDoorY2)
  g.lineStyle(0)
  // Door handle
  g.beginFill(0x8a7a5a)
  g.drawRect(wx + 2, (ZONE.solidDoorY1 + ZONE.solidDoorY2) / 2, 8, 2)
  g.endFill()

  stage.addChild(g)
}

// ─── Zone labels (small pixel text in zone corners) ───────────────────────────
function drawZoneLabels(stage: PIXI.Container) {
  const labels = [
    { text: 'RESEARCH LAB',    x: 14,  y: 65, color: 0x4a7aaa },
    { text: 'CREATIVE STUDIO', x: 14,  y: 347, color: 0xaa6a4a },
    { text: 'UTILITY',         x: 695, y: 347, color: 0x6a8a6a },
  ]
  labels.forEach(({ text, x, y, color }) => {
    const t = new PIXI.Text(text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 4,
      fill: color,
    })
    t.alpha = 0.55
    t.x = x; t.y = y
    stage.addChild(t)
  })
}

// ─── WC (utility corner) ─────────────────────────────────────────────────────
function drawWC(stage: PIXI.Container) {
  const g = new PIXI.Graphics()
  const ox = ZONE.solidPartX + 15   // left edge of utility zone
  const oy = ZONE.solidPartY1 + 8   // top of utility zone

  // ── Toilet stall divider (horizontal partition inside WC) ────────────────
  g.beginFill(C.wallSolid)
  g.drawRect(ox, oy + 70, 200, 6)
  g.endFill()

  // ── Toilet (from above, top of utility zone) ─────────────────────────────
  // Tank (rectangle, against right wall)
  g.beginFill(0xd0d0c8)
  g.drawRect(CANVAS_W - 32, oy + 8, 28, 16)
  g.endFill()
  g.lineStyle(1, 0xa0a098, 0.7)
  g.drawRect(CANVAS_W - 32, oy + 8, 28, 16)
  g.lineStyle(0)
  // Bowl (rounded)
  g.beginFill(0xe8e8e0)
  g.drawEllipse(CANVAS_W - 18, oy + 40, 12, 16)
  g.endFill()
  g.lineStyle(1, 0xb0b0a8, 0.6)
  g.drawEllipse(CANVAS_W - 18, oy + 40, 12, 16)
  g.lineStyle(0)
  // Inner bowl water
  g.beginFill(0x8abccc, 0.5)
  g.drawEllipse(CANVAS_W - 18, oy + 40, 7, 10)
  g.endFill()

  // ── Sink ──────────────────────────────────────────────────────────────────
  g.beginFill(0xe0e0d8)
  g.drawRoundedRect(ox + 20, oy + 12, 26, 20, 3)
  g.endFill()
  g.lineStyle(1, 0xb0b0a8, 0.6)
  g.drawRoundedRect(ox + 20, oy + 12, 26, 20, 3)
  g.lineStyle(0)
  // Basin
  g.beginFill(0xaaccdd, 0.5)
  g.drawEllipse(ox + 33, oy + 22, 8, 6)
  g.endFill()
  // Faucet
  g.beginFill(0xa0a090)
  g.drawRect(ox + 31, oy + 9, 4, 6)
  g.endFill()

  // ── Mirror above sink ────────────────────────────────────────────────────
  g.beginFill(0x2a3a4a)
  g.drawRect(ox + 16, oy - 2, 34, 3)
  g.endFill()
  g.beginFill(0x7aaccc, 0.35)
  g.drawRect(ox + 16, oy + 1, 34, 8)
  g.endFill()

  // ── WC label ─────────────────────────────────────────────────────────────
  stage.addChild(g)
  const lbl = new PIXI.Text('WC', {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 5,
    fill: 0x8a9a8a,
  })
  lbl.alpha = 0.7
  lbl.anchor.set(0.5, 0)
  lbl.x = ox + 100; lbl.y = oy + 80
  stage.addChild(lbl)
}

function drawRoomTitle(stage: PIXI.Container) {
  const t = new PIXI.Text('CONTENT WAR ROOM', {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 7,
    fill: 0xd4aa30,
  })
  t.alpha = 0.42
  t.anchor.set(0.5, 0)
  t.x = CANVAS_W / 2
  t.y = 10
  stage.addChild(t)
}

// ─── Pixel art helpers ────────────────────────────────────────────────────────
function renderFrame(pixels: CharDef, px: number): PIXI.Graphics {
  const g = new PIXI.Graphics()
  pixels.forEach((row, ri) => {
    for (let ci = 0; ci < row.length; ci++) {
      const ch = row[ci]
      if (ch === '_' || ch === ' ') continue
      const color = PALETTE[ch]
      if (color === undefined) continue
      g.beginFill(color)
      g.drawRect(ci * px, ri * px, px, px)
      g.endFill()
    }
  })
  return g
}

// ─── ZZZ Bubble ───────────────────────────────────────────────────────────────
class ZzzBubble {
  readonly container: PIXI.Container
  private zz: PIXI.Graphics[] = []
  private tMs = 0
  private shown = false

  constructor() {
    this.container = new PIXI.Container()
    this.container.visible = false

    ;[
      { pixels: ZZZ_S, px: 2, ox: 0,  oy: 0   },
      { pixels: ZZZ_M, px: 2, ox: 6,  oy: -15 },
      { pixels: ZZZ_L, px: 2, ox: 14, oy: -34 },
    ].forEach(({ pixels, px, ox, oy }) => {
      const g = new PIXI.Graphics()
      pixels.forEach((row, ri) => {
        for (let ci = 0; ci < row.length; ci++) {
          if (row[ci] === '_') continue
          g.beginFill(0x88ccee, 0.85)
          g.drawRect(ci * px, ri * px, px, px)
          g.endFill()
        }
      })
      g.x = ox; g.y = oy
      this.zz.push(g)
      this.container.addChild(g)
    })
  }

  show()  { this.shown = true;  this.container.visible = true  }
  hide()  { this.shown = false; this.container.visible = false }

  update(dMs: number) {
    if (!this.shown) return
    this.tMs += dMs
    this.zz.forEach((g, i) => {
      const base = [0, -15, -34][i]
      g.y    = base + Math.sin(this.tMs / 900 * Math.PI + i * 1.3) * 3.5
      g.alpha = 0.5 + 0.5 * Math.sin(this.tMs / 600 * Math.PI + i * 0.9)
    })
  }
}

// ─── Speech bubble ────────────────────────────────────────────────────────────
function makeSpeechBubble(): PIXI.Container {
  const c = new PIXI.Container()
  const bg = new PIXI.Graphics()
  bg.beginFill(0x080f1c, 0.92)
  bg.lineStyle(1, 0x44aaff, 0.85)
  bg.drawRoundedRect(-36, -22, 72, 24, 3)
  bg.endFill()
  bg.lineStyle(1, 0x44aaff, 0.85)
  bg.moveTo(-6, 2); bg.lineTo(0, 9); bg.lineTo(6, 2)
  c.addChild(bg)

  const dots = new PIXI.Text('...', {
    fontFamily: '"Share Tech Mono", monospace',
    fontSize: 12,
    fill: 0x44aaff,
  })
  dots.anchor.set(0.5, 0.5)
  dots.x = 0; dots.y = -10
  c.addChild(dots)
  c.visible = false
  return c
}

// ─── Character sprite ─────────────────────────────────────────────────────────
type CharState = 'zzz' | 'idle' | 'work' | 'walk' | 'meeting'

class CharacterSprite {
  readonly container: PIXI.Container
  private id: string
  private state: CharState = 'zzz'

  // Pre-built frames; toggled by visibility
  private frameMap = new Map<string, PIXI.Graphics>()
  private activeFr = ''

  private zzz: ZzzBubble
  private bubble: PIXI.Container
  private workGlow: PIXI.Graphics

  private tMs = 0
  private walkTMs = 0
  private walkTarget: { x: number; y: number; onArrive: () => void } | null = null
  private readonly walkSpeed = 68  // px/second (was 115 — slower = more natural)

  // Current base Y when NOT walking (used for bob)
  private baseX: number
  private baseY: number
  readonly homePos: { x: number; y: number }

  // Phase offset so each character bobs at slightly different phase
  private bobPhase: number

  constructor(id: string, agentColorHex: number) {
    this.id = id
    this.homePos = { ...DESK_POS[id] }
    this.baseX = this.homePos.x
    this.baseY = this.homePos.y
    this.bobPhase = id.length * 0.8  // deterministic phase offset
    this.container = new PIXI.Container()

    const frames = CHAR_FRAMES[id]
    if (frames) {
      ;(['idle', 'walkA', 'walkB'] as const).forEach((key) => {
        const g = renderFrame(frames[key], PIXEL)
        g.x = -SPR_W / 2
        g.y = -SPR_H
        g.visible = false
        this.frameMap.set(key, g)
        this.container.addChild(g)
      })
      this._showFr('idle')
    }

    // Work glow — floor light under feet (additive blend = lâmpada no chão)
    this.workGlow = new PIXI.Graphics()
    this.workGlow.beginFill(agentColorHex, 0.32)
    this.workGlow.drawEllipse(0, 0, 28, 10)
    this.workGlow.endFill()
    this.workGlow.beginFill(agentColorHex, 0.15)
    this.workGlow.drawEllipse(0, 0, 40, 15)
    this.workGlow.endFill()
    this.workGlow.blendMode = PIXI.BLEND_MODES.ADD
    this.workGlow.visible = false
    this.container.addChildAt(this.workGlow, 0)  // behind sprite frames

    // ZZZ bubble
    this.zzz = new ZzzBubble()
    this.zzz.container.x = SPR_W / 2 + 4
    this.zzz.container.y = -SPR_H - 2
    this.container.addChild(this.zzz.container)

    // Speech bubble
    this.bubble = makeSpeechBubble()
    this.bubble.x = 0
    this.bubble.y = -SPR_H - 26
    this.container.addChild(this.bubble)

    this.container.x = this.homePos.x
    this.container.y = this.homePos.y
  }

  private _showFr(key: string) {
    if (key === this.activeFr) return
    const old = this.frameMap.get(this.activeFr)
    if (old) old.visible = false
    const next = this.frameMap.get(key)
    if (next) next.visible = true
    this.activeFr = key
  }

  setState(s: CharState) {
    if (this.state === s) return
    // Clear any in-progress walk when switching to a non-walk state.
    // Without this, an interrupted walkAlongPath leaves walkTarget non-null,
    // which permanently breaks isAvailableForIdle.
    if (s !== 'walk') this.walkTarget = null
    this.state = s
    this.zzz.hide()
    this.bubble.visible = false
    this.workGlow.visible = false

    switch (s) {
      case 'zzz':
        this._showFr('idle')
        this.zzz.show()
        break
      case 'idle':
        this._showFr('idle')
        break
      case 'work':
        this._showFr('idle')
        this.workGlow.visible = true
        break
      case 'meeting':
        this._showFr('idle')
        this.bubble.visible = true
        this.workGlow.visible = true
        break
      case 'walk':
        this._showFr('walkA')
        break
    }
  }

  get isAvailableForIdle(): boolean {
    return this.state === 'idle' && this.walkTarget === null
  }

  walkTo(tx: number, ty: number, onArrive: () => void) {
    this.walkTarget = { x: tx, y: ty, onArrive }
    this.walkTMs = 0
    if (this.state !== 'walk') this.setState('walk')
  }

  /** Walk through an ordered list of waypoints, calling onArrive at the last one */
  walkAlongPath(waypoints: Array<{x:number;y:number}>, onArrive: () => void) {
    if (waypoints.length === 0) { onArrive(); return }
    const [next, ...rest] = waypoints
    this.walkTo(next.x, next.y, () => this.walkAlongPath(rest, onArrive))
  }

  goHome(endState: CharState = 'zzz') {
    const path = planPath(this.container.x, this.container.y, this.homePos.x, this.homePos.y)
    this.walkAlongPath(path, () => {
      this.baseX = this.homePos.x
      this.baseY = this.homePos.y
      this.setState(endState)
    })
  }

  update(dMs: number) {
    this.tMs += dMs
    this.zzz.update(dMs)

    // ── Walking ──────────────────────────────────────────────────────────────
    if (this.state === 'walk' && this.walkTarget) {
      const speed = (this.walkSpeed / 1000) * dMs
      const dx = this.walkTarget.x - this.container.x
      const dy = this.walkTarget.y - this.container.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= speed + 0.5) {
        this.container.x = this.walkTarget.x
        this.container.y = this.walkTarget.y
        this.baseX = this.walkTarget.x
        this.baseY = this.walkTarget.y
        const cb = this.walkTarget.onArrive
        this.walkTarget = null
        cb()
      } else {
        this.container.x += (dx / dist) * speed
        this.container.y += (dy / dist) * speed
        this.walkTMs += dMs
        // Alternate legs: one stride every ~350ms
        this._showFr(Math.floor(this.walkTMs / 175) % 2 === 0 ? 'walkA' : 'walkB')
      }
      return
    }

    // ── Idle / work / zzz bob ────────────────────────────────────────────────
    // Only bob when at home position (prevents snap-to-home during meeting)
    const atHome =
      Math.abs(this.baseX - this.homePos.x) < 2 &&
      Math.abs(this.baseY - this.homePos.y) < 2

    if (atHome) {
      // Smooth sine bob: 3.5s period, 2.5px amplitude
      const bobY = Math.sin(this.tMs / 3500 * Math.PI * 2 + this.bobPhase) * 2.5
      this.container.y = this.homePos.y + bobY
    }

    // ── Floor glow pulse (work / meeting) ────────────────────────────────────
    if (this.workGlow.visible) {
      this.workGlow.alpha = 0.5 + 0.5 * Math.abs(Math.sin(this.tMs / 900 * Math.PI))
    }

    // ── Speech bubble "..." pulse ────────────────────────────────────────────
    if (this.bubble.visible) {
      const dots = this.bubble.children[1] as PIXI.Text
      if (dots) dots.alpha = 0.4 + 0.6 * Math.sin(this.tMs / 550 * Math.PI)
    }
  }

  get sortY(): number { return this.container.y }
}

// ─── Agent desk labels ────────────────────────────────────────────────────────
function makeAgentLabel(id: string, cx: number, isNorth: boolean): PIXI.Container {
  const cfg = AGENT_CONFIG[id]
  if (!cfg) return new PIXI.Container()
  const c = new PIXI.Container()
  const labelY = isNorth ? 74 : 386

  const persona = new PIXI.Text(cfg.persona, {
    fontFamily: '"Share Tech Mono", monospace',
    fontSize: 7,
    fill: 0x60708a,
  })
  persona.anchor.set(0.5, 1)
  persona.x = cx; persona.y = labelY - 8
  c.addChild(persona)

  const role = new PIXI.Text(cfg.role.toUpperCase(), {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 4,
    fill: cfg.colorHex,
  })
  role.anchor.set(0.5, 1)
  role.x = cx; role.y = labelY
  c.addChild(role)

  return c
}

// ─── Named activity spots ─────────────────────────────────────────────────────
const BOOKSHELF_SPOTS = [
  { x: 44,  y: 144 },  // Research Lab bookshelf (against north wall)
  { x: 864, y: 144 },  // Strategy Office bookshelf
]

const PLANT_SPOTS = [
  { x: 418, y: 210 },  // Lab plant (near glass partition)
  { x: 248, y: 318 },  // Corridor left plant
  { x: 636, y: 318 },  // Corridor right plant
  { x: 570, y: 492 },  // Creative Studio plant
]

const COFFEE_SPOT = { x: 714, y: 482 }  // Coffee machine in utility zone

// ─── Idle activity spots (mapped to new zone layout) ─────────────────────────
const IDLE_SPOTS = [
  { x: 58,  y: 154 },   // Research Lab — bookshelf
  { x: 228, y: 200 },   // Research Lab — open floor between desks
  { x: 104, y: 222 },   // Research Lab — near south plant
  { x: 575, y: 486 },   // Creative Studio — center plant
  { x: 380, y: 330 },   // Corridor — table west side
  { x: 524, y: 330 },   // Corridor — table east side
  { x: 450, y: 350 },   // Corridor — table south
  { x: 306, y: 291 },   // Corridor — left side
  { x: 600, y: 291 },   // Corridor — right side
  { x: 290, y: 432 },   // Creative Studio — open floor between desks
  { x: 540, y: 436 },   // Creative Studio — open floor right
]

// Pairs of nearby spots for two agents to "chat" at
const CHAT_SPOT_PAIRS: Array<[{ x: number; y: number }, { x: number; y: number }]> = [
  [{ x: 182, y: 200 }, { x: 226, y: 206 }],   // Research Lab — between desks
  [{ x: 294, y: 295 }, { x: 338, y: 295 }],   // Corridor — left
  [{ x: 558, y: 295 }, { x: 602, y: 295 }],   // Corridor — right
  [{ x: 380, y: 307 }, { x: 422, y: 307 }],   // Near briefing table
  [{ x: 290, y: 434 }, { x: 334, y: 434 }],   // Creative Studio
]

// ─── WarRoomCanvas ────────────────────────────────────────────────────────────
export class WarRoomCanvas {
  private app!: PIXI.Application
  private chars = new Map<string, CharacterSprite>()
  private charLayer!: PIXI.Container
  private officeMode: 'sleep' | 'active' = 'sleep'

  // Agents on system tasks (working/thinking — should NOT get idle activities)
  private busyAgents = new Set<string>()
  // Agents currently doing an idle activity (wander / chat)
  private idleActivityAgents = new Set<string>()
  // Timer for next idle-activity check
  private idleCheckMs = 0
  private readonly IDLE_INTERVAL_MS = 12000
  // WC occupied state + dark overlay
  private wcOccupied = false
  private wcOverlay!: PIXI.Graphics

  async init(parent: HTMLElement) {
    this.app = new PIXI.Application({
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: 0x0a0e1a,
      antialias: false,
      resolution: 1,
    })

    const canvas = this.app.view as HTMLCanvasElement
    canvas.style.cssText =
      'display:block;width:100%;height:100%;' +
      'image-rendering:pixelated;image-rendering:crisp-edges;'
    parent.appendChild(canvas)

    // ── Environment (order matters for z-layering) ────────────────────────
    drawFloor(this.app.stage)
    drawZoneFloors(this.app.stage)      // executive + WC tiles on top of base floor
    drawBottomWall(this.app.stage)
    drawTopWall(this.app.stage)

    // ── Props: Research Lab (top-left zone) ───────────────────────────────
    drawBookshelf(this.app.stage, 14, 66)       // against north wall, far left
    drawPlant(this.app.stage, 418, 200)         // inside lab, right corner near glass

    // ── Props: Strategy Office (top-right zone) ───────────────────────────
    drawWhiteboard(this.app.stage, 604, 66)     // on north wall of strategy office
    drawPlant(this.app.stage, 868, 170, true)   // big plant in exec office corner
    // Trophy/award shelf (small accent)
    drawBookshelf(this.app.stage, 834, 66)      // bookshelf in strategy office

    // ── Props: Central corridor ───────────────────────────────────────────
    drawPlant(this.app.stage, 248, 310)         // corridor left
    drawPlant(this.app.stage, 636, 310)         // corridor right

    // ── Props: Creative Studio (bottom-left zone) ─────────────────────────
    drawPlant(this.app.stage, 570, 488)         // studio plant

    // ── Props: Utility zone (bottom-right) ────────────────────────────────
    drawCoffeeMachine(this.app.stage, 700, 468) // coffee near door
    drawServerRack(this.app.stage, 752, 458)    // server rack
    drawWC(this.app.stage)                      // WC facilities

    // ── Partition walls (drawn after floor, before furniture) ─────────────
    drawPartitionWalls(this.app.stage)

    // ── Desks ─────────────────────────────────────────────────────────────
    const northIds = ['pesquisador', 'curador', 'estrategista_pauta']
    // Research Lab desks (y=90)
    ;['pesquisador', 'curador'].forEach((id) => {
      const p = DESK_POS[id]; if (!p) return
      drawDesk(this.app.stage, p.x, 90, id)
    })
    // Strategy Office desk (y=88 — slightly higher, more room)
    drawDesk(this.app.stage, DESK_POS.estrategista_pauta.x, 88, 'estrategista_pauta')
    // Creative Studio desks (y=396)
    ;['hook_writer', 'critico_hooks'].forEach((id) => {
      const p = DESK_POS[id]; if (!p) return
      drawDesk(this.app.stage, p.x, 396, id)
    })

    // Meeting table
    drawMeetingTable(this.app.stage)

    // Zone labels (after floor, before characters)
    drawZoneLabels(this.app.stage)

    // Agent labels (fixed above desks)
    Object.keys(DESK_POS).forEach((id) => {
      const p = DESK_POS[id]; if (!p) return
      this.app.stage.addChild(makeAgentLabel(id, p.x, northIds.includes(id)))
    })

    drawRoomTitle(this.app.stage)

    // ── WC darkness overlay (visible when someone is inside) ───────────────
    this.wcOverlay = new PIXI.Graphics()
    this.wcOverlay.beginFill(0x000000, 0.62)
    this.wcOverlay.drawRect(
      ZONE.solidPartX + 15, ZONE.solidPartY1,
      CANVAS_W - ZONE.solidPartX - 15, ZONE.solidPartY2 - ZONE.solidPartY1
    )
    this.wcOverlay.endFill()
    this.wcOverlay.visible = false
    this.app.stage.addChild(this.wcOverlay)

    // ── Character layer (on top of everything) ────────────────────────────
    this.charLayer = new PIXI.Container()
    this.charLayer.sortableChildren = true
    this.app.stage.addChild(this.charLayer)

    Object.keys(DESK_POS).forEach((id) => {
      const cfg = AGENT_CONFIG[id]
      const sprite = new CharacterSprite(id, cfg?.colorHex ?? 0xffffff)
      sprite.setState('zzz')
      this.chars.set(id, sprite)
      this.charLayer.addChild(sprite.container)
    })

    this.app.ticker.add(() => {
      const dMs = this.app.ticker.deltaMS
      this._update(dMs)
    })
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  setOfficeMode(mode: 'sleep' | 'active') {
    this.officeMode = mode
    // Cancel all idle activities when mode changes
    this.idleActivityAgents.clear()
    this.idleCheckMs = 0
    this.chars.forEach((sprite) => {
      sprite.setState(mode === 'sleep' ? 'zzz' : 'idle')
    })
  }

  setAgentStatus(id: string, status: AgentStatus) {
    const sprite = this.chars.get(id)
    if (!sprite) return

    if (status === 'thinking' || status === 'working') {
      this.busyAgents.add(id)
      this.idleActivityAgents.delete(id)  // cancel any idle roaming
    } else {
      this.busyAgents.delete(id)
    }

    switch (status) {
      case 'idle':
        sprite.setState(this.officeMode === 'sleep' ? 'zzz' : 'idle')
        break
      case 'thinking':
      case 'working':
        sprite.setState('work')
        break
      case 'completed':
      case 'error':
        sprite.setState('idle')
        break
    }
  }

  triggerMeeting(from: string, to: string) {
    const fs = this.chars.get(from)
    const ts = this.chars.get(to)
    const fTarget = MEETING_POS[from]
    const tTarget = MEETING_POS[to]
    if (!fs || !ts || !fTarget || !tTarget) return

    // Pull them out of any idle activity
    this.idleActivityAgents.delete(from)
    this.idleActivityAgents.delete(to)

    const fp = planPath(fs.container.x, fs.container.y, fTarget.x, fTarget.y)
    const tp = planPath(ts.container.x, ts.container.y, tTarget.x, tTarget.y)
    fs.walkAlongPath(fp, () => fs.setState('meeting'))
    ts.walkAlongPath(tp, () => ts.setState('meeting'))

    setTimeout(() => {
      const endState: CharState = this.officeMode === 'sleep' ? 'zzz' : 'idle'
      fs.goHome(endState)
      ts.goHome(endState)
    }, 5500)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  triggerFlyingMessage(_fm: FlyingMessage) { /* handled via triggerMeeting */ }

  destroy() { this.app?.destroy(true) }

  // ─── Idle activity system ──────────────────────────────────────────────────

  private _scheduleIdleActivities(dMs: number) {
    if (this.officeMode !== 'active') return
    this.idleCheckMs += dMs
    if (this.idleCheckMs < this.IDLE_INTERVAL_MS) return
    // Reset with jitter so bursts don't sync up
    this.idleCheckMs = -(Math.random() * 3000)

    // Collect agents that are free to roam
    const free = Array.from(this.chars.entries()).filter(
      ([id, sprite]) =>
        !this.busyAgents.has(id) &&
        !this.idleActivityAgents.has(id) &&
        sprite.isAvailableForIdle
    )

    if (free.length === 0) return

    // Shuffle
    free.sort(() => Math.random() - 0.5)

    const roll = Math.random()

    // 10% chance: WC visit (only if not already occupied)
    if (roll < 0.10 && !this.wcOccupied) {
      const [id, sprite] = free[0]
      this._startWCVisit(id, sprite)
      return
    }

    // 14% chance: coffee run to utility zone
    if (roll < 0.24) {
      const [id, sprite] = free[0]
      this._startCoffeeRun(id, sprite)
      return
    }

    // 14% chance: bookshelf browse
    if (roll < 0.38) {
      const [id, sprite] = free[0]
      const spot = BOOKSHELF_SPOTS[Math.floor(Math.random() * BOOKSHELF_SPOTS.length)]
      this._startBookshelfBrowse(id, sprite, spot)
      return
    }

    // 10% chance: water / look at a plant
    if (roll < 0.48) {
      const [id, sprite] = free[0]
      const spot = PLANT_SPOTS[Math.floor(Math.random() * PLANT_SPOTS.length)]
      this._startPlantVisit(id, sprite, spot)
      return
    }

    // 30% chance: casual chat (needs 2+ free agents)
    if (free.length >= 2 && roll < 0.78) {
      const [[id1, s1], [id2, s2]] = free
      const pair = CHAT_SPOT_PAIRS[Math.floor(Math.random() * CHAT_SPOT_PAIRS.length)]
      this._startIdleChat(id1, s1, pair[0], id2, s2, pair[1])
      return
    }

    // Otherwise: 1-2 agents wander to a generic spot
    const count = Math.min(free.length, Math.random() < 0.35 ? 2 : 1)
    for (let i = 0; i < count; i++) {
      const [id, sprite] = free[i]
      const spot = IDLE_SPOTS[Math.floor(Math.random() * IDLE_SPOTS.length)]
      this._startIdleWander(id, sprite, spot)
    }
  }

  private _startIdleWander(
    id: string,
    sprite: CharacterSprite,
    spot: { x: number; y: number }
  ) {
    this.idleActivityAgents.add(id)
    const path = planPath(sprite.container.x, sprite.container.y, spot.x, spot.y)
    sprite.walkAlongPath(path, () => {
      const linger = 3750 + Math.random() * 3750  // +50% vs previous 2500–5000
      setTimeout(() => {
        if (!this.idleActivityAgents.has(id)) return
        sprite.goHome(this.officeMode === 'sleep' ? 'zzz' : 'idle')
        setTimeout(() => this.idleActivityAgents.delete(id), 6000)
      }, linger)
    })
  }

  private _startIdleChat(
    id1: string, s1: CharacterSprite, pos1: { x: number; y: number },
    id2: string, s2: CharacterSprite, pos2: { x: number; y: number }
  ) {
    this.idleActivityAgents.add(id1)
    this.idleActivityAgents.add(id2)
    let a1 = false, a2 = false

    const onBoth = () => {
      if (!a1 || !a2) return
      s1.setState('meeting')
      s2.setState('meeting')
      const chatDur = 6000 + Math.random() * 4500  // +50% vs previous 4000–7000
      setTimeout(() => {
        if (!this.idleActivityAgents.has(id1) && !this.idleActivityAgents.has(id2)) return
        const endState: CharState = this.officeMode === 'sleep' ? 'zzz' : 'idle'
        s1.goHome(endState)
        s2.goHome(endState)
        setTimeout(() => {
          this.idleActivityAgents.delete(id1)
          this.idleActivityAgents.delete(id2)
        }, 6000)
      }, chatDur)
    }

    const p1 = planPath(s1.container.x, s1.container.y, pos1.x, pos1.y)
    const p2 = planPath(s2.container.x, s2.container.y, pos2.x, pos2.y)
    s1.walkAlongPath(p1, () => { a1 = true; onBoth() })
    s2.walkAlongPath(p2, () => { a2 = true; onBoth() })
  }

  private _startWCVisit(id: string, sprite: CharacterSprite) {
    this.idleActivityAgents.add(id)
    const path = planPath(sprite.container.x, sprite.container.y, DOORS.wcSpot.x, DOORS.wcSpot.y)
    sprite.walkAlongPath(path, () => {
      // Turn off the lights — agent is inside
      this.wcOccupied = true
      this.wcOverlay.visible = true
      const duration = 8000 + Math.random() * 7000
      setTimeout(() => {
        // Always restore lights, even if activity was cancelled externally
        this.wcOccupied = false
        this.wcOverlay.visible = false
        if (!this.idleActivityAgents.has(id)) return
        sprite.goHome(this.officeMode === 'sleep' ? 'zzz' : 'idle')
        setTimeout(() => this.idleActivityAgents.delete(id), 8000)
      }, duration)
    })
  }

  private _startBookshelfBrowse(
    id: string,
    sprite: CharacterSprite,
    spot: { x: number; y: number }
  ) {
    this.idleActivityAgents.add(id)
    const path = planPath(sprite.container.x, sprite.container.y, spot.x, spot.y)
    sprite.walkAlongPath(path, () => {
      const linger = 9000 + Math.random() * 11000  // 9–20s browsing
      setTimeout(() => {
        if (!this.idleActivityAgents.has(id)) return
        sprite.goHome(this.officeMode === 'sleep' ? 'zzz' : 'idle')
        setTimeout(() => this.idleActivityAgents.delete(id), 8000)
      }, linger)
    })
  }

  private _startPlantVisit(
    id: string,
    sprite: CharacterSprite,
    spot: { x: number; y: number }
  ) {
    this.idleActivityAgents.add(id)
    const path = planPath(sprite.container.x, sprite.container.y, spot.x, spot.y)
    sprite.walkAlongPath(path, () => {
      const linger = 4000 + Math.random() * 5000  // 4–9s watering / admiring
      setTimeout(() => {
        if (!this.idleActivityAgents.has(id)) return
        sprite.goHome(this.officeMode === 'sleep' ? 'zzz' : 'idle')
        setTimeout(() => this.idleActivityAgents.delete(id), 8000)
      }, linger)
    })
  }

  private _startCoffeeRun(id: string, sprite: CharacterSprite) {
    this.idleActivityAgents.add(id)
    const path = planPath(sprite.container.x, sprite.container.y, COFFEE_SPOT.x, COFFEE_SPOT.y)
    sprite.walkAlongPath(path, () => {
      const linger = 10000 + Math.random() * 10000  // 10–20s getting coffee
      setTimeout(() => {
        if (!this.idleActivityAgents.has(id)) return
        sprite.goHome(this.officeMode === 'sleep' ? 'zzz' : 'idle')
        setTimeout(() => this.idleActivityAgents.delete(id), 8000)
      }, linger)
    })
  }

  // ─── Render loop ───────────────────────────────────────────────────────────
  private _update(dMs: number) {
    this.chars.forEach((sprite) => {
      sprite.update(dMs)
      sprite.container.zIndex = Math.round(sprite.sortY)
    })
    this._scheduleIdleActivities(dMs)
  }
}

