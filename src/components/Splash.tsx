import { useEffect, useRef, useState } from 'react'
import { useGlitch } from '../hooks/useGlitch'

const MIN_MS = 3800 // slow enough to read the line and watch the bar fill
const MAX_MS = 9000 // never hold the visitor longer than this
const EXIT_MS = 1100

/**
 * Shown on every load and refresh of the home page. It is skipped only when you arrive from another page of this site
 * (back from a case study), when you ask for reduced motion, and on deep links like /#projects reached from inside the site.
 */
function shouldShow() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (nav?.type === 'reload') return true
  try {
    if (document.referrer && new URL(document.referrer).origin === window.location.origin) return false
  } catch {
    /* ignore */
  }
  return true
}

const preload = (url: string) =>
  new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = url
  })

/**
 * Loading screen. The percentage is honest: it climbs toward 90 on its own and only reaches 100 once the fonts, the
 * page and the portrait images have really loaded. It then lifts away to reveal the hero.
 */
export default function Splash() {
  const [show, setShow] = useState(shouldShow)
  const [pct, setPct] = useState(0) // fractional, so the bar moves smoothly while the number counts in whole steps
  const [exiting, setExiting] = useState(false)
  const aiRef = useRef<HTMLSpanElement>(null)

  useGlitch(aiRef, { wait: [500, 1100], duration: [980, 1150], strength: [10, 18], burstChance: 0.3 })

  useEffect(() => {
    if (!show) return
    document.documentElement.classList.add('splash-lock')
    const start = performance.now()
    let ready = false
    let readyAt = 0
    let raf = 0
    let done = false

    const pageLoaded = new Promise<void>((res) => {
      if (document.readyState === 'complete') res()
      else window.addEventListener('load', () => res(), { once: true })
    })
    Promise.all([
      document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve(),
      pageLoaded,
      preload('/portrait-headdown-cutout.png'),
      preload('/portrait-lum.png'),
    ]).then(() => {
      ready = true
      readyAt = performance.now()
    })

    const finish = () => {
      if (done) return
      done = true
      window.setTimeout(() => setExiting(true), 350)
      window.setTimeout(() => {
        document.documentElement.classList.remove('splash-lock')
        window.scrollTo(0, 0)
        setShow(false)
      }, 350 + EXIT_MS)
    }

    const tick = (now: number) => {
      const t = now - start
      // A steady, eased climb. It follows a gentle curve toward 90% and never waits on the network to look alive; once
      // everything has really loaded (and the minimum time has passed) it glides on to 100%.
      const idle = 90 * (1 - Math.pow(1 - Math.min(1, t / (MIN_MS * 0.92)), 2.2))
      let p = idle
      if (ready && t >= MIN_MS * 0.8) {
        const from = Math.max(readyAt, start + MIN_MS * 0.8)
        const k = Math.min(1, (now - from) / 1100)
        const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2 // easeInOutQuad
        p = idle + (100 - idle) * ease
      }
      if (t > MAX_MS) p = 100
      setPct(Math.min(100, p))
      if (p >= 99.95 && t >= MIN_MS) {
        setPct(100)
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('splash-lock')
    }
  }, [show])

  if (!show) return null

  return (
    <div className={`splash${exiting ? ' is-exiting' : ''}`} role="status" aria-live="polite" aria-label="Loading portfolio">
      <div className="splash-centre">
        <p className="splash-mark" aria-hidden="true">
          <span>S</span>
          <span className="ai" ref={aiRef}>
            <span className="ai-layer l-blue">AI</span>
            <span className="ai-layer l-red">AI</span>
            <span className="ai-layer l-cyan">AI</span>
            <span className="ai-base">AI</span>
            <span className="ai-layer l-s1">AI</span>
            <span className="ai-layer l-s2">AI</span>
            <span className="ai-layer l-s3">AI</span>
          </span>
          <span> KRISHNA</span>
        </p>
        <p className="splash-line label">
          AI/ML &middot; Computer Vision
          <br />
          Full-Stack &middot; UI/UX Design
        </p>
      </div>

      <div className="splash-foot label" aria-hidden="true">
        <i className="splash-track">
          <b style={{ transform: `scaleX(${pct / 100})` }} />
        </i>
        <div className="splash-row">
          <span>Portfolio</span>
          <span className="sp-mid">Is loading.</span>
          <span className="sp-mid">Please wait</span>
          <span className="splash-pct">{String(Math.round(pct)).padStart(3, '0')}%</span>
          <span className="sp-mid">Out of</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}
