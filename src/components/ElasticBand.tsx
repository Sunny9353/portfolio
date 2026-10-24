import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Same numbers and same logic as the white band between the hero and About (see ElasticSection.tsx).
const VBH = 160 // curve viewBox height
const STRETCH = -270 // control point at full stretch (bows the edge up like a dome)
const TRIGGER = 0.2 // the band bounces once it has risen 20% of the screen height

/**
 * An elastic band that rises over the page before it (black for Projects, white for Skillset). It behaves exactly like
 * the white band above About:
 *   - Scrolling DOWN, while the band rises through the bottom 20% of the screen: its top edge is already curved,
 *     with the middle resting on the bottom of the About page and the sides hanging below it.
 *   - Crossing the 20% line: the sides rise smoothly and the middle does the rubber-band bounce.
 *   - Scrolling UP: none of that happens, the edge stays flat.
 */
export default function ElasticBand({ tone, children }: { tone: 'dark' | 'light'; children: ReactNode }) {
  const section = useRef<HTMLElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    const sec = section.current
    const edge = edgeRef.current
    const path = pathRef.current
    if (!sec || !edge || !path) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // S: how far the SIDES hang below the middle (the stretch), 0 when flat
    // M: how far the MIDDLE is displaced (the bounce)
    const state = { S: 0, M: 0 }
    const unit = () => edge.offsetHeight / VBH // svg units -> px
    const render = () => {
      const px = unit()
      const v = (2 * (state.M - state.S)) / px // control point (middle y = v / 2 relative to the sides)
      path.setAttribute('d', `M0,0 Q500,${v} 1000,0 L1000,${VBH} L0,${VBH} Z`)
      sec.style.transform = `translateY(${-2 + state.S}px)`
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

    let prevY = window.scrollY
    let prevTop = Infinity

    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        const vh = window.innerHeight

        render()
        // where the middle of the band's edge is on screen
        const top = edge.getBoundingClientRect().top + (state.M - state.S)
        const line = vh * (1 - TRIGGER)
        if (!reduce) {
          if (y > prevY) {
            if (top < line && prevTop >= line) bounce()
            else if (top >= line) to(maxS(), 0.2) // bent before it even appears
          } else if (y < prevY && (state.S !== 0 || state.M !== 0)) {
            to(0, 0.2)
          }
          // a jump past the 20% line (anchor link, scrollbar drag) must not leave the stretch behind
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
      sec.style.transform = ''
    }
  }, [])

  return (
    <section className={`pband ${tone}`} ref={section}>
      <div className="pband-edge" ref={edgeRef} aria-hidden="true">
        <svg viewBox={`0 0 1000 ${VBH}`} preserveAspectRatio="none">
          <path ref={pathRef} d={`M0,0 Q500,0 1000,0 L1000,${VBH} L0,${VBH} Z`} />
        </svg>
      </div>
      <div className="pband-body">
        {children}
      </div>
    </section>
  )
}
