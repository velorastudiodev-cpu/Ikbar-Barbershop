import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Inline the (small) stylesheet into index.html so it never blocks the first paint.
function inlineCss() {
  return {
    name: 'inline-css',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!bundle) return html
        for (const [file, asset] of Object.entries(bundle)) {
          if (!file.endsWith('.css')) continue
          const tag = new RegExp(`<link rel="stylesheet"[^>]*href="/${file}"[^>]*>`)
          if (!tag.test(html)) continue
          html = html.replace(tag, () => `<style>${asset.source}</style>`)
          delete bundle[file]
        }
        return html
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), inlineCss()],
  // Preact's compat layer runs the same React components at a fraction of the download size.
  resolve: {
    alias: {
      'react-dom/client': 'preact/compat/client',
      'react-dom/server': 'preact/compat/server',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      react: 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
})
