import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/playfair-display/900.css'
import '@fontsource/playfair-display/400.css'
import '@fontsource/inter-tight/600.css'
import '@fontsource/saira/400.css'
import '@fontsource/aldrich/400.css'
import '@fontsource/orbitron/400.css'
import '@fontsource/orbitron/700.css'
import '@fontsource/jetbrains-mono/400.css'
import './tokens.css'
import './styles.css'
import './about.css'
import './skills.css'
import './projects.css'
import './contact.css'
import './splash.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
