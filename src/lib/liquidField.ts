import * as THREE from 'three'

/**
 * A small liquid-like "glitch density" field (CPU, 84 x 112 cells, uploaded as an 8-bit texture).
 *
 * The shader shows the glitch wherever this field has density, so the glitch behaves like a
 * liquid instead of a patch glued to the cursor:
 *   - the cursor INJECTS density (it pools up while you rest on a spot),
 *   - your motion injects VELOCITY, so a wave of glitch is pushed ahead in the direction you move,
 *   - density is advected by that velocity (semi-Lagrangian), so it travels and carries momentum,
 *   - a gentle pull toward the cursor makes the trail you left flow back and slowly cover the
 *     place where you stopped,
 *   - diffusion spreads it like liquid, damping stops the flow, and a slow decay leaves the
 *     after-effect trail that fades away.
 * Units: cells and seconds. Grid origin is bottom-left, matching the shader's UV space.
 */

export const GRID_W = 84
export const GRID_H = 112

const DENSITY_GAIN = 3.4   // how fast resting on a spot fills it with glitch (per second)
const PUSH = 0.55          // how much of the cursor's velocity is handed to the liquid
const PULL = 30            // acceleration toward the cursor (cells / s^2)
const DAMP = 2.0           // velocity damping (1 / s)
const DIFFUSE = 3.2        // spreading (1 / s)
const DECAY = 1.3          // fade of the trail (1 / s)

export class LiquidField {
  readonly texture: THREE.DataTexture
  private d = new Float32Array(GRID_W * GRID_H)
  private vx = new Float32Array(GRID_W * GRID_H)
  private vy = new Float32Array(GRID_W * GRID_H)
  private d2 = new Float32Array(GRID_W * GRID_H)
  private vx2 = new Float32Array(GRID_W * GRID_H)
  private vy2 = new Float32Array(GRID_W * GRID_H)
  private bytes = new Uint8Array(GRID_W * GRID_H)

  constructor() {
    this.texture = new THREE.DataTexture(this.bytes, GRID_W, GRID_H, THREE.RedFormat, THREE.UnsignedByteType)
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.wrapS = THREE.ClampToEdgeWrapping
    this.texture.wrapT = THREE.ClampToEdgeWrapping
    this.texture.needsUpdate = true
  }

  /** bilinear sample with clamped edges */
  private static sample(a: Float32Array, x: number, y: number): number {
    const fx = Math.min(Math.max(x, 0), GRID_W - 1.001)
    const fy = Math.min(Math.max(y, 0), GRID_H - 1.001)
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = fx - x0
    const ty = fy - y0
    const i = y0 * GRID_W + x0
    const top = a[i] * (1 - tx) + a[i + 1] * tx
    const bot = a[i + GRID_W] * (1 - tx) + a[i + GRID_W + 1] * tx
    return top * (1 - ty) + bot * ty
  }

  /**
   * @param dt        seconds since last step
   * @param cx, cy    cursor position, in grid cells
   * @param cvx, cvy  cursor velocity, in cells / second
   * @param radius    cursor core radius, in cells
   * @param active    pointer is over the portrait
   */
  step(dt: number, cx: number, cy: number, cvx: number, cvy: number, radius: number, active: boolean) {
    const { d, vx, vy, d2, vx2, vy2 } = this

    if (active) {
      const R2 = radius * radius
      const reach = Math.ceil(radius * 2.4)
      const speed = Math.hypot(cvx, cvy)
      // a lead point slightly ahead of the cursor: the wave is pushed out in front of the motion
      const lead = speed > 1 ? Math.min(radius * 0.9, speed * 0.04) / speed : 0
      const lx = cx + cvx * lead
      const ly = cy + cvy * lead
      const x0 = Math.max(0, Math.floor(cx - reach))
      const x1 = Math.min(GRID_W - 1, Math.ceil(cx + reach))
      const y0 = Math.max(0, Math.floor(cy - reach))
      const y1 = Math.min(GRID_H - 1, Math.ceil(cy + reach))
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = y * GRID_W + x
          const fall = Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (R2 * 0.8))
          d[i] = Math.min(1, d[i] + DENSITY_GAIN * fall * dt)
          const fl = Math.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (R2 * 1.1))
          const k = Math.min(1, dt * 9) * fl
          vx[i] += (cvx * PUSH - vx[i]) * k
          vy[i] += (cvy * PUSH - vy[i]) * k
        }
      }
      // pull: liquid left around the place you are resting on flows back and covers it
      const pullR = radius * 4.6
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const i = y * GRID_W + x
          const di = d[i]
          if (di < 0.02) continue
          const dx = cx - x
          const dy = cy - y
          const dist = Math.hypot(dx, dy)
          if (dist < 0.6 || dist > pullR) continue
          const w = (1 - dist / pullR) * di * PULL * dt
          vx[i] += (dx / dist) * w
          vy[i] += (dy / dist) * w
        }
      }
    }

    // advect density and velocity (semi-Lagrangian)
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const i = y * GRID_W + x
        const sx = x - vx[i] * dt
        const sy = y - vy[i] * dt
        d2[i] = LiquidField.sample(d, sx, sy)
        vx2[i] = LiquidField.sample(vx, sx, sy)
        vy2[i] = LiquidField.sample(vy, sx, sy)
      }
    }

    // diffuse (3x3 blur mix), damp the flow, fade the trail
    const mix = Math.min(1, DIFFUSE * dt)
    const damp = Math.exp(-DAMP * dt)
    const decay = Math.exp(-DECAY * dt)
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const i = y * GRID_W + x
        const xl = x > 0 ? i - 1 : i
        const xr = x < GRID_W - 1 ? i + 1 : i
        const yu = y > 0 ? i - GRID_W : i
        const yd = y < GRID_H - 1 ? i + GRID_W : i
        const avg = (d2[xl] + d2[xr] + d2[yu] + d2[yd]) * 0.25
        const v = (d2[i] + (avg - d2[i]) * mix) * decay
        d[i] = v < 0.004 ? 0 : v
        vx[i] = vx2[i] * damp
        vy[i] = vy2[i] * damp
        this.bytes[i] = Math.min(255, Math.round(d[i] * 255))
      }
    }
    this.texture.needsUpdate = true
  }

  dispose() {
    this.texture.dispose()
  }
}
