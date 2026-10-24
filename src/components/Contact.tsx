import { useEffect, useRef } from 'react'

const EMAIL = 'saikrishnagps41@gmail.com'
const NAME = 'SAI KRISHNA'
const LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gps-sai-krishna/', external: true },
  { label: 'GitHub', href: 'https://github.com/Sunny9353', external: true },
  { label: 'Resume (PDF)', href: '/G_P_S_Sai_Krishna_Resume.pdf', external: true },
]

/**
 * Closing section: availability, a Let's Connect button (opens a new email), the main links, and the name set huge
 * along the bottom, whose letters light up as the pointer passes over them.
 */
export default function Contact() {
  const name = useRef<HTMLDivElement>(null)

  // A soft spotlight follows the pointer over the name. The light position and strength ease toward the pointer every
  // frame (so it glides and fades instead of jumping), and the loop stops when everything has settled.
  useEffect(() => {
    const el = name.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return
    const cur = { x: 0, y: 0, a: 0 }
    const tgt = { x: 0, y: 0, a: 0 }
    let raf = 0
    let primed = false

    const frame = () => {
      raf = 0
      cur.x += (tgt.x - cur.x) * 0.1
      cur.y += (tgt.y - cur.y) * 0.1
      cur.a += (tgt.a - cur.a) * 0.07
      el.style.setProperty('--mx', `${cur.x.toFixed(1)}px`)
      el.style.setProperty('--my', `${cur.y.toFixed(1)}px`)
      el.style.setProperty('--ma', cur.a.toFixed(3))
      const settled = Math.abs(tgt.x - cur.x) < 0.5 && Math.abs(tgt.y - cur.y) < 0.5 && Math.abs(tgt.a - cur.a) < 0.004
      if (!settled) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tgt.x = e.clientX - r.left
      tgt.y = e.clientY - r.top
      tgt.a = 1
      if (!primed) {
        cur.x = tgt.x // the light fades in where the pointer entered instead of sweeping in from the corner
        cur.y = tgt.y
        primed = true
      }
      kick()
    }
    const leave = () => {
      tgt.a = 0
      primed = false
      kick()
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <footer className="ct" id="contact">
      <div className="ct-wrap">
        <p className="ct-avail label">
          <i className="ct-dot" aria-hidden="true" />
          Open to AI/ML, Computer Vision, Full Stack Dev and UI/UX Design
        </p>
        <div className="ct-row">
          <h2 className="ct-title">Let&rsquo;s work together.</h2>
          <nav className="ct-links" aria-label="Contact links">
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <a className="connect ct-connect" href={`mailto:${EMAIL}`}>
          Let&rsquo;s Connect <span aria-hidden="true">&#8599;</span>
        </a>

        <div ref={name} className="ct-name" aria-hidden="true">
          <span className="ct-name-base">{NAME}</span>
          <span className="ct-name-glow">{NAME}</span>
          <span className="ct-name-lit">{NAME}</span>
        </div>

        <div className="ct-foot label">
          <span>&copy; 2026 G P S Sai Krishna &middot; Hyderabad, India</span>
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            Back to top &uarr;
          </a>
        </div>
      </div>
    </footer>
  )
}
