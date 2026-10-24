import { useEffect, useRef } from 'react'
import { useGlitch } from '../hooks/useGlitch'
import TypoPortrait from './TypoPortrait'

const DESIGN_W = 1440
const DESIGN_H = 900
const PORTRAIT_W = 642 // width of the portrait box in the design
// The visible composition spans the name (x ~88) to the right edge of the portrait (x ~1040)
const CONTENT_W = 1000
const CONTENT_CENTER = 565
// The name block sits at x=86 in the design; on wider screens it hugs the left margin instead
const INTRO_LEFT = 86
const LEFT_MARGIN = INTRO_LEFT / DESIGN_W // 6% of the screen width, same as the design

const NAME = 'SAI KRISHNA'
const DOMAINS = ['AI & ML Engineering', 'Computer Vision', 'Backend & Data', 'Full-Stack Web', 'UI Design']
const TAGLINE = 'I build AI that sees, decides, and acts, and the full-stack software that carries it.'

// Background themes can be previewed with ?bg=<name> (see styles.css)
const BACKGROUNDS = ['void', 'spotlight', 'haze', 'grid', 'brackets', 'charcoal'] as const
type Background = (typeof BACKGROUNDS)[number]

function readBackground(): Background {
  const q = new URLSearchParams(window.location.search).get('bg')
  return (BACKGROUNDS as readonly string[]).includes(q ?? '') ? (q as Background) : 'void'
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const aiRef = useRef<HTMLSpanElement>(null)
  const bg = readBackground()

  // VHS-style chromatic glitch on just the "AI" in SAI: random bursts, never the same twice.
  useGlitch(aiRef, { wait: [2600, 6500], duration: [980, 1150], strength: [10, 18], burstChance: 0.3 })

  // Fit the fixed 1440x900 design to any window.
  // - Scale so the portrait fills the height whenever the width allows it.
  // - If the full artboard fits, keep it centred (exact design layout);
  //   otherwise centre the visible composition (name + portrait) instead,
  //   so nothing drifts off one side on narrow windows.
  // The stage is pinned to the bottom, so the waist always sits on the bottom edge.
  useEffect(() => {
    const fit = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const el = stageRef.current
      const hero = heroRef.current
      if (!el || !hero) return
      const compact = vw < 640 || vw / vh < 0.9 // phones and portrait tablets
      if (compact) {
        // Phone / portrait tablet: the name, line and chips sit under the top bar at their own readable size, and the
        // portrait takes the rest of the height, centred, with the watch on the bottom edge.
        const intro = el.querySelector<HTMLElement>('.intro')
        const gutter = Math.max(20, Math.min(vw * 0.06, 56))
        const m = Math.min(1.15, Math.max(0.8, vw / 480)) // text size relative to the desktop design
        const topbarH = hero.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 56
        el.style.setProperty('--intro-w', `${(vw - gutter * 2) / m}px`)
        el.style.setProperty('--intro-m', String(m))
        const introH = (intro?.offsetHeight ?? 220) * m
        const top = topbarH + Math.min(vh * 0.05, 36) + 12
        const room = vh - top - introH - 12
        const s = Math.max(0.3, Math.min(room / 800, (vw * 1.12) / PORTRAIT_W))
        const x = vw / 2 - (399 + PORTRAIT_W / 2) * s
        const stageTop = vh - DESIGN_H * s // where the artboard's top edge lands on screen
        hero.setAttribute('data-compact', '')
        el.style.setProperty('--s', String(s))
        el.style.setProperty('--x', `${x}px`)
        el.style.setProperty('--intro-dx', '0px')
        el.style.setProperty('--intro-x', `${(gutter - x) / s}px`)
        el.style.setProperty('--intro-y', `${(top - stageTop) / s}px`)
        el.style.setProperty('--intro-k', String(m / s))
        return
      }
      hero.removeAttribute('data-compact')
      const s = Math.min(vh / DESIGN_H, vw / CONTENT_W)
      const artboardFits = vw >= DESIGN_W * s
      const anchor = artboardFits ? DESIGN_W / 2 : CONTENT_CENTER
      const x = vw / 2 - anchor * s
      // Name block: keep the design position, but never further from the left edge than 6% of the width
      const natural = x + INTRO_LEFT * s
      const target = Math.min(natural, vw * LEFT_MARGIN)
      el.style.setProperty('--s', String(s))
      el.style.setProperty('--x', `${x}px`)
      el.style.setProperty('--intro-dx', `${(target - natural) / s}px`)
    }
    fit()
    document.fonts?.ready.then(fit) // the intro's height depends on the web fonts
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // the scroll cue is only for the very top of the page
  useEffect(() => {
    const cue = heroRef.current?.querySelector<HTMLElement>('.scroll-cue')
    const onScroll = () => {
      if (!cue) return
      const gone = window.scrollY > 40
      cue.style.opacity = gone ? '0' : ''
      cue.style.pointerEvents = gone ? 'none' : ''
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="hero" data-bg={bg} ref={heroRef}>
      <div className="backdrop" aria-hidden="true" />
      <header className="topbar">
        <a className="corner-name" href="/" aria-label="Sai Krishna, home">SAI KRISHNA</a>
        <a className="connect" href="mailto:saikrishnagps41@gmail.com">
          Let&rsquo;s Connect <span aria-hidden="true">&#8599;</span>
        </a>
      </header>
      <a
        className="scroll-cue"
        href="#about"
        aria-label="Scroll down"
        onClick={(e) => {
          e.preventDefault()
          window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' })
        }}
      >
        <span className="label">Scroll down</span>
        <i aria-hidden="true" />
      </a>
      <div className="stage" ref={stageRef}>
        <div className="intro">
          <h1 className="name" aria-label={NAME}>
            <span className="name-part" aria-hidden="true">S</span>
            <span className="ai" ref={aiRef} aria-hidden="true">
              <span className="ai-layer l-blue">AI</span>
              <span className="ai-layer l-red">AI</span>
              <span className="ai-layer l-cyan">AI</span>
              <span className="ai-base">AI</span>
              <span className="ai-layer l-s1">AI</span>
              <span className="ai-layer l-s2">AI</span>
              <span className="ai-layer l-s3">AI</span>
            </span>
            <span className="name-part" aria-hidden="true"> KRISHNA</span>
          </h1>
          <p className="tagline">{TAGLINE}</p>
          <ul className="domains">
            {DOMAINS.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>

        <div className="portrait-wrap">
          <TypoPortrait />
        </div>

        <div className="frame-marks" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
      </div>
    </section>
  )
}
