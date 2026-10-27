import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const root = document.getElementById('root')
// Content baked in at build time (from the CMS) when available; App still refreshes it from the CMS.
const app = <StrictMode><App initial={window.__SITE__} /></StrictMode>
// The build prerenders the page into #root; hydrate it instead of rendering from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
