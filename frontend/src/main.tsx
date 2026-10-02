import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

// Set initial lang/dir from localStorage before React hydrates
// (mirrors the inline script in the reference site's index.html)
;(function () {
  try {
    const saved = localStorage.getItem('invite-studio.lang')
    if (saved !== 'ar' && saved !== 'en') return
    const html = document.documentElement
    html.lang = saved
    html.dir = saved === 'ar' ? 'rtl' : 'ltr'
  } catch {}
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
