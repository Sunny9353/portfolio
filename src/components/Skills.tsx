import { useEffect, useRef } from 'react'

const GROUPS: { domain: string; tools: string[]; used: { title: string; slug?: string }[] }[] = [
  {
    domain: 'AI / Computer Vision',
    tools: ['PyTorch', 'YOLOv8 / YOLO11', 'DeepLabV3', 'OpenCV', 'MediaPipe', 'scikit-learn'],
    used: [
      { title: 'Shadow Falcons', slug: 'shadow-falcons' },
      { title: 'Swach Mysuru Abhyan', slug: 'swach-mysuru-abhyan' },
    ],
  },
  {
    domain: 'Speech & LLM',
    tools: ['faster-whisper', 'openWakeWord', 'Speaker verification', 'LLM API integration'],
    used: [],
  },
  {
    domain: 'Backend & Data',
    tools: ['FastAPI', 'Node.js', 'Express', 'PostgreSQL', 'Supabase', 'Firebase', 'MongoDB'],
    used: [
      { title: 'Swach Mysuru Abhyan', slug: 'swach-mysuru-abhyan' },
      { title: 'ARC Labs', slug: 'arc-labs' },
      { title: 'AI/ML Learning Platform', slug: 'ai-ml-learning-platform' },
    ],
  },
  {
    domain: 'Frontend & UI/UX',
    tools: ['React', 'Next.js', 'Three.js', 'Framer Motion', 'Figma', 'Flutter', 'Tauri'],
    used: [
      { title: 'ARC Labs', slug: 'arc-labs' },
      { title: 'AI/ML Learning Platform', slug: 'ai-ml-learning-platform' },
      { title: 'Swach Mysuru Abhyan', slug: 'swach-mysuru-abhyan' },
    ],
  },
  {
    domain: 'Embedded / IoT',
    tools: ['ESP32-S3', 'BLE', 'MQTT', 'CoAP', 'Crazyflie CRTP'],
    used: [{ title: 'Shadow Falcons', slug: 'shadow-falcons' }],
  },
  {
    domain: 'Languages & Tools',
    tools: ['Python', 'TypeScript', 'JavaScript', 'C', 'SQL', 'Java', 'Git', 'Docker', 'Vercel'],
    used: [{ title: 'Every project' }],
  },
]

/** The domain name split into characters so the white-theme flash can run through it on hover. */
function Chars({ text }: { text: string }) {
  let n = 0
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(' ').map((w, wi, all) => (
          <span key={wi}>
            <span className="sk-w">
              {[...w].map((c) => (
                <span key={n} className="sk-c" style={{ ['--hwi' as string]: n++ }}>
                  {c}
                </span>
              ))}
            </span>
            {wi < all.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </>
  )
}

/**
 * Skillset, on white right after About: one hairline row per domain with its tools as outlined tags and the projects
 * that used them. Everything is visible at once; the hovered row brightens and its name flashes. The rows rise in as the
 * section comes into view.
 */
export default function Skills() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) {
      el.classList.add('in')
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in')
          io.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="sk" id="skills" ref={root} aria-labelledby="sk-title">
      <header className="sk-head">
        <h2 className="sk-title" id="sk-title">
          Skillset
        </h2>
        <span className="sk-count label">({String(GROUPS.length).padStart(2, '0')})</span>
      </header>

      <ul className="sk-list">
        {GROUPS.map((g, i) => (
          <li className="sk-row" key={g.domain} style={{ ['--ri' as string]: i }}>
            <span className="sk-num label">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="sk-dom">
              <Chars text={g.domain} />
            </h3>
            <ul className="sk-tools" aria-label={`${g.domain} tools`}>
              {g.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="sk-used">
              {g.used.length > 0 && <span className="label">Used in</span>}
              {g.used.map((u) =>
                u.slug ? (
                  <a key={u.title} href={`/work/${u.slug}`}>
                    {u.title} <i aria-hidden="true">&#8599;</i>
                  </a>
                ) : (
                  <span key={u.title}>{u.title}</span>
                ),
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
