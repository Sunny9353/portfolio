import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { PROJECTS } from '../projects/data'
import type { Project } from '../projects/data'
import Media from '../components/Media'
import '../case.css'

const pad = (n: number) => String(n).padStart(2, '0')

/** One project, laid out as a case study: cover, brief, my role, approach, scope, visuals, honest status. */
export default function CaseStudy({ project }: { project: Project }) {
  const index = PROJECTS.indexOf(project)
  const next = PROJECTS[(index + 1) % PROJECTS.length]
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    document.title = `${project.title} - Case study - G P S Sai Krishna`
    window.scrollTo(0, 0)
    const prevBg = document.body.style.background
    document.body.style.background = '#fff' // the home page is black behind everything; this page is white

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // smooth scrolling, same feel as the home page
    let lenis: Lenis | null = null
    let raf = 0
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
      const loop = (t: number) => {
        lenis?.raf(t)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    // reading progress in the top bar
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      bar.current?.style.setProperty('--p', String(p))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    // reveal blocks as they scroll into view
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    let io: IntersectionObserver | null = null
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'))
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('in')
              io?.unobserve(e.target)
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
      )
      els.forEach((e) => io!.observe(e))
    }

    return () => {
      cancelAnimationFrame(raf)
      lenis?.destroy()
      io?.disconnect()
      window.removeEventListener('scroll', onScroll)
      document.body.style.background = prevBg
    }
  }, [project])

  return (
    <main className="case">
      <header className="case-top">
        <a className="case-brand" href="/">
          SAI KRISHNA
        </a>
        <span className="case-index label">
          {pad(index + 1)} / {pad(PROJECTS.length)}
        </span>
        <a className="case-back label" href="/#projects">
          &larr; All projects
        </a>
        <span className="case-progress" ref={bar} aria-hidden="true" />
      </header>

      <section className="case-hero wrap">
        <p className="label case-label" data-reveal>
          (CASE STUDY &middot; {pad(index + 1)})
        </p>
        <h1 className="case-title" data-reveal>
          {project.title}
        </h1>
        <ul className="case-pills" data-reveal>
          {project.tags.map((t) => (
            <li key={t} className="label">
              {t}
            </li>
          ))}
        </ul>
        <figure className="case-cover" data-reveal>
          <Media src={project.cover.src} art={project.cover.art} alt={project.cover.alt} lazy={false} />
        </figure>
      </section>

      <section className="case-brief wrap">
        <p className="case-lede" data-reveal>
          {project.intro}
        </p>
        <dl className="case-meta" data-reveal>
          <div>
            <dt className="label">Role</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt className="label">Timeline</dt>
            <dd>{project.timeline}</dd>
          </div>
          <div>
            <dt className="label">Year</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt className="label">Team</dt>
            <dd>{project.team}</dd>
          </div>
        </dl>
      </section>

      <section className="case-block wrap">
        <p className="label case-label" data-reveal>
          (MY ROLE)
        </p>
        <ul className="case-role">
          {project.myRole.map((r) => (
            <li key={r} data-reveal>
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="case-block wrap">
        <h2 className="case-h2" data-reveal>
          Approach
        </h2>
        <ol className="case-approach">
          {project.approach.map((a, i) => (
            <li key={a.title} data-reveal>
              <span className="label case-step">{pad(i + 1)}</span>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="case-block wrap">
        <p className="label case-label" data-reveal>
          (SCOPE)
        </p>
        <ul className="case-scope">
          {project.scope.map((s) => (
            <li key={s.label} data-reveal>
              <strong>{s.n}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="case-block wrap">
        <p className="label case-label" data-reveal>
          (VISUALS)
        </p>
        <div className={`case-shots${project.images.length === 1 ? ' is-single' : ''}`}>
          {project.images.map((im) => (
            <figure key={im.src ?? im.art} data-reveal>
              <div className="case-frame">
                <Media src={im.src} art={im.art} alt={im.alt} />
              </div>
              <figcaption>{im.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="case-block case-status wrap">
        <p className="label case-label" data-reveal>
          (STATUS &amp; LIMITS)
        </p>
        <ul>
          {project.status.map((s) => (
            <li key={s} data-reveal>
              {s}
            </li>
          ))}
        </ul>
        {project.links && (
          <p className="case-links" data-reveal>
            {project.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                {l.label} <span aria-hidden="true">&#8599;</span>
              </a>
            ))}
          </p>
        )}
      </section>

      <footer className="case-next wrap">
        <p className="label case-label">(NEXT PROJECT)</p>
        <a className="case-next-link" href={`/work/${next.slug}`}>
          <span>{next.title}</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
        <div className="case-foot">
          <a className="label" href="/#projects">
            All projects
          </a>
          <a className="case-connect" href="mailto:saikrishnagps41@gmail.com">
            Let&rsquo;s Connect <span aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </footer>
    </main>
  )
}
