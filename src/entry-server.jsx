import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { FALLBACK } from './data.js'

export { loadSiteData } from './data.js'

/** Build-time render (see scripts/prerender.js); `site` is the CMS content when available. */
export const render = (site = FALLBACK) => renderToString(<StrictMode><App initial={site} /></StrictMode>)
