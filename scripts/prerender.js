// Renders the page into dist/index.html so content paints before any JS runs.
// With VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set (as on Vercel), the CMS content is baked in,
// so search engines and first paint already show what the dashboard says.
// Run after `vite build` and `vite build --ssr src/entry-server.jsx --outDir dist-ssr`.
import { readFile, writeFile, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const { render, loadSiteData } = await import(pathToFileURL(resolve('dist-ssr/entry-server.js')).href)

let site
const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env
if (url && key) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    site = await loadSiteData(createClient(url, key))
    console.log('Prerendering with CMS content')
  } catch (err) {
    console.warn('CMS unreachable at build time, prerendering built-in content:', err.message)
  }
}

const html = await readFile('dist/index.html', 'utf8')
if (!html.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill')
// The client starts from the same data it was rendered with, so hydration matches.
const state = site ? `<script>window.__SITE__=${JSON.stringify(site).replace(/</g, '\\u003c')}</script>` : ''
await writeFile('dist/index.html', html.replace('<div id="root"></div>', `<div id="root">${render(site)}</div>${state}`))
await rm('dist-ssr', { recursive: true, force: true })
console.log('Prerendered dist/index.html')
