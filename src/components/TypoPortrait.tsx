import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { fragmentShader, vertexShader } from '../shaders/typoPortrait'
import { buildGlyphAtlas } from '../lib/glyphAtlas'
import { GRID_H, GRID_W, LiquidField } from '../lib/liquidField'

// design-space geometry (px at the 1440x900 artboard)
const W = 642
const H = 856
const CELL_W = 3.8
const CELL_H = 6.0
const REVEAL_R = 86 // core radius of the glitch cloud, design px
const EDGE = 7
const IMG_W = 1086 // source texture width, for the cell-averaging mip level

export default function TypoPortrait() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true })
    } catch {
      setFailed(true)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(1)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const field = new LiquidField()
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const uniforms = {
      u_image: { value: null as THREE.Texture | null },
      u_lum: { value: null as THREE.Texture | null },
      u_font: { value: null as THREE.Texture | null },
      u_field: { value: field.texture as THREE.Texture },
      u_resolution: { value: new THREE.Vector2(W, H) },
      u_cell: { value: new THREE.Vector2(CELL_W, CELL_H) },
      u_glyphCount: { value: 16 },
      u_lod: { value: 0 },
      u_mouse: { value: new THREE.Vector2(-9999, -9999) },
      u_radius: { value: REVEAL_R },
      u_edge: { value: EDGE },
      u_time: { value: 0 },
      u_vel: { value: 0 },
      u_glitch: { value: reduce ? 0 : 1 },
    }
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    quad.frustumCulled = false
    scene.add(quad)

    // pointer state, all in drawing-buffer pixels
    const st = { mx: 0, my: 0, tx: 0, ty: 0, vel: 0, open: false, bufW: W, bufH: H, k: 1 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const bw = Math.max(2, Math.round(rect.width * dpr))
      const bh = Math.max(2, Math.round(rect.height * dpr))
      renderer.setSize(bw, bh, false)
      st.bufW = bw
      st.bufH = bh
      st.k = bw / W // design px -> buffer px
      uniforms.u_resolution.value.set(bw, bh)
      uniforms.u_cell.value.set(CELL_W * st.k, CELL_H * st.k)
      uniforms.u_edge.value = EDGE * st.k
      uniforms.u_radius.value = REVEAL_R * st.k
      uniforms.u_lod.value = Math.max(0, Math.log2(Math.max(CELL_W * st.k * (IMG_W / bw), 1)))
    }

    const toBuf = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: ((e.clientX - rect.left) / rect.width) * st.bufW,
        y: (1 - (e.clientY - rect.top) / rect.height) * st.bufH,
      }
    }
    const onEnter = (e: PointerEvent) => {
      const p = toBuf(e)
      st.tx = p.x
      st.ty = p.y
      if (!st.open) {
        st.open = true
        st.mx = p.x
        st.my = p.y
      }
    }
    const onMove = (e: PointerEvent) => {
      const p = toBuf(e)
      st.tx = p.x
      st.ty = p.y
    }
    const onLeave = () => {
      st.open = false
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') onLeave()
    }
    canvas.addEventListener('pointerenter', onEnter)
    canvas.addEventListener('pointerdown', onEnter)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onLeave)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    // The stage is scaled with a CSS transform, which ResizeObserver cannot see,
    // so also re-measure on window resize and every few frames.
    window.addEventListener('resize', resize)
    let lastW = 0
    let lastH = 0
    let frameNo = 0

    // don't spend GPU time on the portrait while it is scrolled out of view
    let onScreen = true
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting })
    io.observe(canvas)

    let raf = 0
    let ready = false
    let disposed = false
    const t0 = performance.now()
    let tPrev = t0
    const radiusCells = (REVEAL_R * GRID_W) / W
    const tick = () => {
      if (disposed) return
      const now = performance.now()
      const dt = Math.min((now - tPrev) / 1000, 1 / 20)
      tPrev = now

      const px = st.mx
      const py = st.my
      st.mx += (st.tx - st.mx) * 0.14
      st.my += (st.ty - st.my) * 0.14
      const moved = Math.hypot(st.mx - px, st.my - py) / (st.bufW * 0.02)
      st.vel += (Math.min(moved, 1) - st.vel) * 0.2

      // cursor in grid cells, and its velocity in cells / second
      const gx = (st.mx / st.bufW) * GRID_W
      const gy = (st.my / st.bufH) * GRID_H
      const cvx = dt > 0 ? (((st.mx - px) / st.bufW) * GRID_W) / dt : 0
      const cvy = dt > 0 ? (((st.my - py) / st.bufH) * GRID_H) / dt : 0
      if (dt > 0) field.step(dt, gx, gy, cvx, cvy, radiusCells, st.open)

      uniforms.u_mouse.value.set(st.mx, st.my)
      uniforms.u_vel.value = st.vel
      uniforms.u_time.value = (now - t0) / 1000
      if (++frameNo % 8 === 0) {
        const r = canvas.getBoundingClientRect()
        if (Math.abs(r.width - lastW) > 0.5 || Math.abs(r.height - lastH) > 0.5) {
          lastW = r.width
          lastH = r.height
          resize()
        }
      }
      if (ready && onScreen) renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }

    // assets
    const loader = new THREE.TextureLoader()
    const load = (url: string) =>
      new Promise<THREE.Texture>((res, rej) => loader.load(url, res, undefined, rej))
    Promise.all([load('/portrait-headdown-cutout.png'), load('/portrait-lum.png'), buildGlyphAtlas()])
      .then(([img, lum, atlas]) => {
        if (disposed) return
        for (const t of [img, lum]) {
          t.minFilter = THREE.LinearMipmapLinearFilter
          t.magFilter = THREE.LinearFilter
          t.generateMipmaps = true
          t.wrapS = THREE.ClampToEdgeWrapping
          t.wrapT = THREE.ClampToEdgeWrapping
          t.needsUpdate = true
        }
        uniforms.u_image.value = img
        uniforms.u_lum.value = lum
        uniforms.u_font.value = atlas.texture
        uniforms.u_glyphCount.value = atlas.count
        ready = true
      })
      .catch(() => setFailed(true))

    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerenter', onEnter)
      canvas.removeEventListener('pointerdown', onEnter)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onLeave)
      field.dispose()
      material.dispose()
      quad.geometry.dispose()
      renderer.dispose()
    }
  }, [])

  if (failed) {
    return (
      <img className="portrait base" src="/portrait-headdown-cutout.png" alt="Portrait of Sai Krishna" width={W} height={H} />
    )
  }
  return <canvas ref={canvasRef} className="typo" role="img" aria-label="Portrait of Sai Krishna" />
}
