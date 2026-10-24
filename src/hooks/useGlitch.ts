import { useEffect } from 'react'
import type { RefObject } from 'react'

const rand = (min: number, max: number) => min + Math.random() * (max - min)

type Range = [number, number]

interface GlitchOptions {
  /** gap between glitches, in ms */
  wait?: Range
  /** how long the `glitching` class stays on, in ms (match the CSS animation length) */
  duration?: Range
  /** value for --gx in px; the CSS scales it for the element */
  strength?: Range
  /** chance of a quick second burst right after a glitch */
  burstChance?: number
}

/**
 * Toggles a `glitching` class on the element at random moments.
 * Every glitch randomises its strength through the --gx / --gy CSS variables,
 * and sometimes fires a quick second burst, so it never looks looped.
 * Disabled for visitors who prefer reduced motion.
 */
export function useGlitch(ref: RefObject<HTMLElement | null>, options: GlitchOptions = {}) {
  const { wait = [2800, 7500], duration = [380, 620], strength = [6, 18], burstChance = 0.3 } = options
  const [waitMin, waitMax] = wait
  const [durMin, durMax] = duration
  const [strMin, strMax] = strength

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let waitTimer = 0
    let endTimer = 0

    const fire = (allowBurst: boolean) => {
      el.style.setProperty('--gx', `${rand(strMin, strMax).toFixed(1)}px`)
      el.style.setProperty('--gy', `${rand(1, 4).toFixed(1)}px`)
      el.style.setProperty('--amp', rand(0.85, 1.45).toFixed(2))
      el.classList.remove('glitching')
      // force a reflow so the animation restarts on back-to-back glitches
      void el.offsetWidth
      el.classList.add('glitching')

      endTimer = window.setTimeout(() => {
        el.classList.remove('glitching')
        if (allowBurst && Math.random() < burstChance) {
          endTimer = window.setTimeout(() => fire(false), rand(160, 320))
        } else {
          schedule()
        }
      }, rand(durMin, durMax))
    }

    const schedule = () => {
      waitTimer = window.setTimeout(() => fire(true), rand(waitMin, waitMax))
    }

    // the first glitch comes a little sooner so it is noticed
    waitTimer = window.setTimeout(() => fire(true), rand(1800, 3200))

    return () => {
      window.clearTimeout(waitTimer)
      window.clearTimeout(endTimer)
      el.classList.remove('glitching')
    }
  }, [ref, waitMin, waitMax, durMin, durMax, strMin, strMax, burstChance])
}
