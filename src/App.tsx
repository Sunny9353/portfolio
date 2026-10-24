import { useEffect } from 'react'
import Hero from './components/Hero'
import ElasticSection from './components/ElasticSection'
import Contact from './components/Contact'
import CaseStudy from './pages/CaseStudy'
import { findProject } from './projects/data'

/** Tiny path router: /work/<slug> is a case study, everything else is the home page. */
function caseSlug(): string | null {
  const m = window.location.pathname.match(/^\/work\/([^/]+)\/?$/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function App() {
  const slug = caseSlug()
  const project = slug ? findProject(slug) : undefined

  // coming back from a case study with /#projects: scroll to the list once the page has been built
  useEffect(() => {
    if (project || window.location.hash !== '#projects') return
    const t = window.setTimeout(() => document.getElementById('projects')?.scrollIntoView(), 350)
    return () => window.clearTimeout(t)
  }, [project])

  if (project) return <CaseStudy project={project} />

  return (
    <>
      <Hero />
      <ElasticSection />
      <Contact />
    </>
  )
}
