import * as THREE from 'three'

/**
 * Builds the glyph strip used by the shader: N serif glyphs ordered from empty to dense.
 * Density is MEASURED (ink coverage of each candidate drawn in the real font), not assumed,
 * so the ramp stays even whichever typeface is used. Candidates are letters from the name
 * and skill words plus punctuation, so the portrait is literally "made of" them.
 */

const CANDIDATES = ".,:;'`-~_ilItrfjcvzsaeonxuhkdbpgyqASIKRHNVWMBDEGO%&@#0$8"

export interface GlyphAtlas {
  texture: THREE.CanvasTexture
  count: number
  glyphs: string
}

export async function buildGlyphAtlas(fontFamily = 'Playfair Display', count = 16): Promise<GlyphAtlas> {
  await document.fonts.load(`400 64px "${fontFamily}"`)
  await document.fonts.ready

  const cw = 48
  const ch = 76
  const fontPx = 62
  const font = `400 ${fontPx}px "${fontFamily}", serif`

  const probe = document.createElement('canvas')
  probe.width = cw
  probe.height = ch
  const pctx = probe.getContext('2d', { willReadFrequently: true })!

  const draw = (ctx: CanvasRenderingContext2D, ch_: string, x: number) => {
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2.4 // thicken hairlines so the glyphs survive at ~5px
    ctx.lineJoin = 'round'
    ctx.strokeText(ch_, x + cw / 2, Math.round(ch * 0.74))
    ctx.fillText(ch_, x + cw / 2, Math.round(ch * 0.74))
  }

  // measure ink density of every candidate
  const measured: { c: string; d: number }[] = [{ c: ' ', d: 0 }]
  for (const c of new Set(CANDIDATES.split(''))) {
    pctx.clearRect(0, 0, cw, ch)
    pctx.fillStyle = '#000'
    pctx.fillRect(0, 0, cw, ch)
    draw(pctx, c, 0)
    const data = pctx.getImageData(0, 0, cw, ch).data
    let sum = 0
    for (let i = 0; i < data.length; i += 4) sum += data[i]
    measured.push({ c, d: sum / 255 })
  }
  measured.sort((a, b) => a.d - b.d)

  // pick `count` glyphs whose densities are evenly spaced between empty and densest
  const maxD = measured[measured.length - 1].d
  const used = new Set<number>()
  const picked: string[] = []
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * maxD
    let best = -1
    let bestDiff = Infinity
    measured.forEach((m, i) => {
      if (used.has(i)) return
      const diff = Math.abs(m.d - target)
      if (diff < bestDiff) {
        bestDiff = diff
        best = i
      }
    })
    used.add(best)
    picked.push(measured[best].c)
  }

  const atlas = document.createElement('canvas')
  atlas.width = cw * count
  atlas.height = ch
  const ctx = atlas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, atlas.width, atlas.height)
  picked.forEach((g, i) => draw(ctx, g, i * cw))

  const texture = new THREE.CanvasTexture(atlas)
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true

  return { texture, count, glyphs: picked.join('') }
}
