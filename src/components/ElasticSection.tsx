import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import About from './About'
import Skills from './Skills'
import ProjectsList from './ProjectsList'
import ElasticBand from './ElasticBand'

gsap.registerPlugin(ScrollTrigger)

const VBH = 160 // curve viewBox height
const STRETCH = -270 // control point at full stretch (bows the edge up like a dome)
const RAMP = 0.08 // the curve reaches full bend after scrolling this much (x screen height)
const TRIGGER = 0.2 // the band bounces once it has risen 20% of the screen height
const OVERHANG = 52 // the portrait runs this many design px below the hero's bottom edge

/**
 * The next page after the hero.
 *   - The portrait and the intro move up first. The band is attached to the bottom of the picture,
 *     so it only comes into view after the picture has moved up, with no empty space in between.
 *   - Scrolling DOWN, while the band rises through the bottom 20% of the screen: its top edge
 *     is already curved from the first bit of scrolling.
 *   - Crossing the 20% line: it snaps flat with a smooth rubber-band bounce.
 *   - Scrolling UP: none of that happens, the edge stays flat.
 * Scrolling itself is smoothed with Lenis.
 */
export default function ElasticSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const edge = edgeRef.current
    const path = pathRef.current
    if (!section || !edge || !path) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stageEl = (document.querySelector('.stage') as HTMLElement) ?? document.documentElement

    // The band's edge is drawn from two things:
    //   S: how far the SIDES hang below the bottom of the picture (the stretch), 0 when flat
    //   M: how far the MIDDLE is displaced from the bottom of the picture (the bounce)
    // While stretching, the middle rests on the picture's bottom and the sides fall away below it,
    // so the band never covers the portrait. When it lets go, the sides rise smoothly and the
    // middle does the rubber-band bounce.
    const state = { S: 0, M: 0 }
    const unit = () => edge.offsetHeight / VBH // svg units -> px
    const render = () => {
      const k = parseFloat(getComputedStyle(stageEl).getPropertyValue('--s')) || 1
      const px = unit()
      const v = (2 * (state.M - state.S)) / px // control point (middle y = v / 2 relative to the sides)
      path.setAttribute('d', `M0,0 Q500,${v} 1000,0 L1000,${VBH} L0,${VBH} Z`)
      // the section is drawn this far below where it sits in the flow; what follows it is moved down by the same amount
      section.style.transform = `translateY(${OVERHANG * k - 2 + state.S}px)`
      section.style.marginBottom = `${OVERHANG * k - 2}px`
    }
    render()

    const maxS = () => (-STRETCH / 2) * unit()

    let bounceTl: gsap.core.Timeline | null = null
    const bouncing = () => !!bounceTl && bounceTl.progress() < 1

    const to = (S: number, duration: number) => {
      bounceTl = null
      return gsap.to(state, { S, M: 0, duration, ease: 'power2.out', overwrite: true, onUpdate: render })
    }

    const bounce = () => {
      gsap.killTweensOf(state)
      const u = unit()
      bounceTl = gsap.timeline({ onUpdate: render })
      bounceTl
        .to(state, { S: 0, duration: 0.5, ease: 'power2.out' })
        .to(state, { M: 30.6 * u, duration: 0.18, ease: 'sine.inOut' }, '-=0.15')
        .to(state, { M: -16.2 * u, duration: 0.17, ease: 'sine.inOut' })
        .to(state, { M: 0, duration: 0.15, ease: 'sine.out' })
    }

    // smooth scrolling
    let lenis: Lenis | null = null
    let tick: ((time: number) => void) | null = null
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
      lenis.on('scroll', ScrollTrigger.update)
      tick = (time) => lenis?.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }

    let prevY = window.scrollY
    let prevTop = Infinity

    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        const vh = window.innerHeight

        render()
        // where the middle of the band's edge is on screen (= the bottom of the picture)
        const top = edge.getBoundingClientRect().top + (state.M - state.S)
        const line = vh * (1 - TRIGGER)
        if (!reduce) {
          if (y > prevY) {
            if (top < line && prevTop >= line) bounce()
            else if (top >= line) to(maxS() * Math.min(1, y / (RAMP * vh)), 0.2) // bent from the first bit of scrolling
          } else if (y < prevY && (state.S !== 0 || state.M !== 0)) {
            to(0, 0.2)
          }
          // a jump past the 20% line (anchor link, drag of the scrollbar) must not leave the stretch behind
          if (top < line && (state.S !== 0 || state.M !== 0) && !bouncing() && !gsap.isTweening(state)) to(0, 0.3)
        }
        prevY = y
        prevTop = top
      },
    })
    st.update()

    return () => {
      st.kill()
      gsap.killTweensOf(state)
      if (tick) gsap.ticker.remove(tick)
      lenis?.destroy()
      section.style.transform = ''
      section.style.marginBottom = ''
    }
  }, [])

  return (
    <section className="next" ref={sectionRef}>
      <div className="next-edge" ref={edgeRef} aria-hidden="true">
        <svg viewBox={`0 0 1000 ${VBH}`} preserveAspectRatio="none">
          <path ref={pathRef} d={`M0,0 Q500,0 1000,0 L1000,${VBH} L0,${VBH} Z`} />
        </svg>
      </div>
      <div className="next-body">
        <About />
      </div>
      {/* white backing under the About page, so the black band's curve is drawn against white, not the black page behind */}
      <div className="pband-back" aria-hidden="true">
        <i />
      </div>
      <ElasticBand tone="dark">
        <ProjectsList />
      </ElasticBand>
      <ElasticBand tone="light">
        <Skills />
      </ElasticBand>
    </section>
  )
}
