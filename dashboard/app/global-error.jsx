'use client'

/**
 * Global error boundary — tampilkan pesan error yang readable
 * di production Vercel, bukan cuma "Internal Server Error"
 * HAPUS file ini setelah masalah terdiagnosis
 */
export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{
        fontFamily: 'monospace',
        background: '#0a0a0a',
        color: '#f1f1f1',
        padding: '40px',
        margin: 0,
      }}>
        <h2 style={{ color: '#ef4444', marginBottom: 16 }}>⚠ Runtime Error</h2>
        <pre style={{
          background: '#1a1a1a',
          padding: 20,
          borderRadius: 8,
          border: '1px solid #333',
          overflowX: 'auto',
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {error?.message || 'Unknown error'}
          {'\n\n'}
          {error?.stack || ''}
        </pre>
        <button
          onClick={reset}
          style={{
            marginTop: 20,
            padding: '8px 16px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Coba Lagi
        </button>
      </body>
    </html>
  )
}
