/**
 * Sprites pixel art dos 5 agentes + ZZZ + frames de walk.
 * Cada sprite: 8 colunas × 14 linhas.
 * '_' = transparente. Letras mapeiam para cores na PALETTE.
 */

export const PALETTE: Record<string, number> = {
  // Pele
  S: 0xd2a679, s: 0xb08050, H: 0xf0c8a0,
  // Cabelo
  M: 0x3e2723, m: 0x5d4037,
  // Olhos / boca / barba
  E: 0x1a1a1a, P: 0xf5a070, L: 0xa0a090,
  // Feynman — camisa xadrez azul/branca
  C: 0x3498db, c: 0x1a6fa8, A: 0xf0f0f0, a: 0xcccccc,
  // Munger — terno cinza
  T: 0x7f8c8d, t: 0x4d6366, I: 0xecf0f1,
  // Graham — moletom verde
  O: 0x6d8b3a, o: 0x4a6128, G: 0x8fad50,
  // Halbert — camisa vermelha
  R: 0xe74c3c, r: 0xc0392b, Y: 0xf1c40f,
  // Sócrates — toga branca, barba
  W: 0xe8e8d8, w: 0xc0c0b0, B: 0xa8b8c8,
  // ZZZ — azul suave
  Z: 0x88ccee,
}

// ─── Helper: cria frame com linhas específicas substituídas ──────────────────
function makeFrame(base: string[], overrides: Record<number, string>): string[] {
  return base.map((row, i) => overrides[i] !== undefined ? overrides[i] : row)
}

// ─── FEYNMAN (Pesquisador) ─────────────────────────────────────────────────
// Camisa xadrez azul aberta, camiseta branca, cabelo bagunçado, óculos redondos
export const FEYNMAN: string[] = [
  '___MM___',
  '__mMMm__',
  '__HHHH__',
  '__HEHE__',
  '__HHsH__',
  '_ACCACA_',
  'CACACAAC',
  '_CaCAca_',
  '_CCCCCC_',
  '__cCCc__',
  '_CC__CC_',
  '_CC__CC_',
  '_Cc__cC_',
  '________',
]
export const FEYNMAN_WALK_A = makeFrame(FEYNMAN, {
  11: 'CC___CC_',
  12: '___Cc___',
})
export const FEYNMAN_WALK_B = makeFrame(FEYNMAN, {
  11: '_CC___CC',
  12: '____cC__',
})

// ─── MUNGER (Curador) ─────────────────────────────────────────────────────
// Terno cinza escuro, gravata, postura ereta, óculos retangular
export const MUNGER: string[] = [
  '___mM___',
  '__mMMm__',
  '__HHHH__',
  '__HEHm__',
  '__HHsH__',
  '_IITII__',
  'TTTITITT',
  '_TtTItT_',
  '_TTTTTT_',
  '__tTTt__',
  '_TT__TT_',
  '_TT__TT_',
  '_Tt__tT_',
  '________',
]
export const MUNGER_WALK_A = makeFrame(MUNGER, {
  11: 'TT___TT_',
  12: '___Tt___',
})
export const MUNGER_WALK_B = makeFrame(MUNGER, {
  11: '_TT___TT',
  12: '____tT__',
})

// ─── GRAHAM (Estrategista) ────────────────────────────────────────────────
// Moletom verde, calça jeans, postura descontraída, sem acessórios
export const GRAHAM: string[] = [
  '___MM___',
  '__MMmm__',
  '__HHHH__',
  '__HEHE__',
  '_EH_HE__',
  '__HHsH__',
  '_GOOOOG_',
  'OOOOOOGO',
  '_OoOOoO_',
  '__oOOo__',
  '_OO__OO_',
  '_OO__OO_',
  '_Oo__oO_',
  '________',
]
export const GRAHAM_WALK_A = makeFrame(GRAHAM, {
  11: 'OO___OO_',
  12: '___Oo___',
})
export const GRAHAM_WALK_B = makeFrame(GRAHAM, {
  11: '_OO___OO',
  12: '____oO__',
})

// ─── HALBERT (Hook Writer) ───────────────────────────────────────────────
// Camisa vermelha manga arregaçada, expressivo, caneta na mão
export const HALBERT: string[] = [
  '__MMmM__',
  '_mMMMm__',
  '__HHHH__',
  '__HmHE__',
  '__HHsH__',
  '_RYRYRY_',
  'RRRYRRRR',
  '_RrRRrRY',
  '_RRRRRR_',
  '__rRRr__',
  '_RR__RR_',
  '_RR__RR_',
  '_Rr__rR_',
  '________',
]
export const HALBERT_WALK_A = makeFrame(HALBERT, {
  11: 'RR___RR_',
  12: '___Rr___',
})
export const HALBERT_WALK_B = makeFrame(HALBERT, {
  11: '_RR___RR',
  12: '____rR__',
})

// ─── SÓCRATES (Crítico) ──────────────────────────────────────────────────
// Toga branca sobre ombros, barba grisalha, postura imponente
export const SOCRATES: string[] = [
  '__LLLL__',
  '_LLLLLL_',
  '__HHHH__',
  '__HEHE__',
  '__HLLH__',
  '_LLLLLL_',
  'WWWWWWWW',
  '_WwWWwW_',
  '_WWWWWW_',
  '__wwww__',
  '_ww__ww_',
  '_ww__ww_',
  '_Ww__wW_',
  '________',
]
export const SOCRATES_WALK_A = makeFrame(SOCRATES, {
  11: 'ww___ww_',
  12: '___Ww___',
})
export const SOCRATES_WALK_B = makeFrame(SOCRATES, {
  11: '_ww___ww',
  12: '____wW__',
})

// ─── Pixel art letras ZZZ ────────────────────────────────────────────────
// Desenhadas em cima dos personagens no estado idle/zzz
export const ZZZ_S: string[] = [   // 4×3 — menor
  'ZZZ_',
  '_ZZ_',
  'ZZZ_',
]
export const ZZZ_M: string[] = [   // 5×4 — médio
  'ZZZZZ',
  '___ZZ',
  '_ZZZ_',
  'ZZZZZ',
]
export const ZZZ_L: string[] = [   // 6×5 — maior
  'ZZZZZZ',
  '____ZZ',
  '__ZZZ_',
  '_ZZ___',
  'ZZZZZZ',
]

// ─── CHAR_FRAMES: frames por agente ──────────────────────────────────────
export type CharDef = string[]
export interface CharFrames {
  idle:  CharDef
  walkA: CharDef
  walkB: CharDef
}

export const CHAR_FRAMES: Record<string, CharFrames> = {
  pesquisador:        { idle: FEYNMAN,  walkA: FEYNMAN_WALK_A,  walkB: FEYNMAN_WALK_B  },
  curador:            { idle: MUNGER,   walkA: MUNGER_WALK_A,   walkB: MUNGER_WALK_B   },
  estrategista_pauta: { idle: GRAHAM,   walkA: GRAHAM_WALK_A,   walkB: GRAHAM_WALK_B   },
  hook_writer:        { idle: HALBERT,  walkA: HALBERT_WALK_A,  walkB: HALBERT_WALK_B  },
  critico_hooks:      { idle: SOCRATES, walkA: SOCRATES_WALK_A, walkB: SOCRATES_WALK_B },
}

// ─── CHAR_MAP legado (mantido para compatibilidade) ──────────────────────
export const CHAR_MAP: Record<string, CharDef> = {
  pesquisador:        FEYNMAN,
  curador:            MUNGER,
  estrategista_pauta: GRAHAM,
  hook_writer:        HALBERT,
  critico_hooks:      SOCRATES,
}
