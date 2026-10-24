import { Fragment, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGlitch } from '../hooks/useGlitch'

gsap.registerPlugin(ScrollTrigger)

const TITLE = ['I', 'build', 'AI', 'that', 'sees,', 'decides,', 'and', 'acts.']

function Words({ words, aiRef }: { words: string[]; aiRef?: RefObject<HTMLSpanElement | null> }) {
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
        <span className="w">
          <span className="wi">
            {w === 'AI' && aiRef ? (
              <span className="ai on-light" ref={aiRef} aria-hidden="true">
                <span className="ai-layer l-blue">AI</span>
                <span className="ai-layer l-red">AI</span>
                <span className="ai-layer l-cyan">AI</span>
                <span className="ai-base">AI</span>
                <span className="ai-layer l-s1">AI</span>
                <span className="ai-layer l-s2">AI</span>
                <span className="ai-layer l-s3">AI</span>
              </span>
            ) : (
              w
            )}
          </span>
        </span>
        {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </>
  )
}

export default function About() {
  const root = useRef<HTMLDivElement>(null)
  const aiRef = useRef<HTMLSpanElement>(null)
  useGlitch(aiRef, { wait: [2600, 6500], duration: [980, 1150], strength: [10, 18], burstChance: 0.3 })

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const q = gsap.utils.selector(el)

    const ctx = gsap.context(() => {
      if (reduce) return

      // headings: words rise out of a mask
      q('[data-words]').forEach((h) => {
        gsap.from(h.querySelectorAll('.wi'), {
          yPercent: 115,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.07,
          scrollTrigger: { trigger: h, start: 'top 85%' },
          onComplete: () => h.classList.add('is-in'),
        })
      })

      gsap.from(q('.about-label'), { opacity: 0, y: 14, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 85%' } })

      // paragraphs
      gsap.from(q('.about-copy p'), {
        y: 28, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.14,
        scrollTrigger: { trigger: q('.about-copy')[0], start: 'top 82%' },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div className="about" ref={root}>
      <p className="about-label">01 &mdash; About</p>

      <h2 className="about-title" data-words aria-label="I build AI that sees, decides, and acts.">
        <Words words={TITLE} aiRef={aiRef} />
      </h2>

      <div className="about-copy">
        <p>
          I&rsquo;m a computer vision and deep-learning engineer who owns the whole loop: curating the
          dataset, training the model, serving it through an API and shipping the app people actually use.
        </p>
        <p>
          A YOLOv8 weapon detector I trained took first prize at three expos, including INSPIRA &rsquo;26
          at IIT Hyderabad.
        </p>
        
        <p>
          I also build full-stack products for paying clients, from payments to admin dashboards, which
          keeps my AI work grounded in things that have to work in production.
        </p>
      </div>
    </div>
  )
}
