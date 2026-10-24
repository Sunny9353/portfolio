import { useState } from 'react'
import { PROJECTS } from '../projects/data'
import Media from './Media'

/**
 * Text split into characters so each one can flash as it arrives (same technique as the reference: every character is
 * its own span with an index and CSS staggers one animation by that index). Words stay in one piece so they never break
 * mid-word. `appear` characters start invisible; the others start from their resting colour.
 */
function Chars({ text, appear = false }: { text: string; appear?: boolean }) {
  let n = 0
  const words = text.split(' ').map((w) => {
    const chars = [...w].map((c) => ({ c, i: n++ }))
    n++ // the space
    return chars
  })
  return (
    <span className={`hw${appear ? ' hw-a' : ''}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((chars, wi) => (
          <span key={wi}>
            <span className="hw-w">
              {chars.map(({ c, i }) => (
                <span key={i} className="hw-c" style={{ ['--hwi' as string]: i }}>
                  {c}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </span>
  )
}

/**
 * Selected Projects: one row per project. A row is highlighted only while the pointer is on it (or it has keyboard
 * focus): its title brightens with a white flash running through the letters, its details appear along the bottom and a
 * preview shows on the right. Move away and everything goes back to rest. The whole row is one link to the case study;
 * "Jump To Project" is its visible affordance.
 */
export default function ProjectsList() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="pj" id="projects">
      <header className="pj-head">
        <h2 className="pj-title">Selected Projects</h2>
        <span className="pj-count label">({String(PROJECTS.length).padStart(2, '0')})</span>
      </header>

      <ul className="pj-list" onMouseLeave={() => setActive(null)}>
        {PROJECTS.map((p, i) => (
          <li
            key={p.slug}
            className={`pj-row${i === active ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive((a) => (a === i ? null : a))}
          >
            <div className="pj-main">
              <div className="pj-top">
                <a className="pj-name" href={`/work/${p.slug}`} aria-label={`${p.title}, open the case study`}>
                  <Chars text={p.title} />
                </a>
                <span className="pj-jump" aria-hidden="true">
                  <Chars text="Jump To Project" /> <span className="pj-arrow">&rarr;</span>
                </span>
              </div>

              <dl className="pj-meta">
                {[
                  ['Role', p.role],
                  ['Timeline', p.timeline],
                  ['Year', p.year],
                  ['Team', p.team],
                ].map(([k, v]) => (
                  <div className="pj-pair" key={k}>
                    <dt className="label">
                      <Chars text={k} appear />
                    </dt>
                    <dd>
                      <Chars text={v} appear />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="pj-thumb" aria-hidden="true">
              <Media src={p.cover.src} art={p.cover.art} alt="" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
