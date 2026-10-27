'use client'
import { useState } from 'react'

// ─── Format helpers ──────────────────────────────────────────────────
function formatIDR(val) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(val)
}
function formatShort(val) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`
  if (val >= 1_000) return `${Math.round(val / 1_000)}rb`
  return `${Math.round(val)}`
}

// ─── SVG Line Chart ──────────────────────────────────────────────────
export default function ChartPanel({ monthlyData }) {
  const [tooltip, setTooltip] = useState(null)

  const emptyState = !monthlyData || monthlyData.every(d => d.omzet === 0 && d.trx === 0)

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Tren 6 Bulan Terakhir</div>
          <div className="panel-sub">Omzet & perkiraan untung per bulan</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ width: 20, height: 2, background: 'var(--chart-omzet)', display: 'inline-block', borderRadius: 1 }} />
            Omzet
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ width: 20, height: 2, background: 'var(--success)', display: 'inline-block', borderRadius: 1 }} />
            Perkiraan untung
          </span>
        </div>
      </div>

      <div className="panel-body">
        {emptyState ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 200, gap: 8, color: 'var(--text-muted)',
          }}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <p style={{ fontSize: 13 }}>Belum ada data penjualan untuk ditampilkan</p>
            <p style={{ fontSize: 11, opacity: 0.6 }}>Mulai input penjualan harian di menu Penjualan & Kas</p>
          </div>
        ) : (
          <Chart data={monthlyData} tooltip={tooltip} setTooltip={setTooltip} />
        )}
      </div>
    </div>
  )
}

function Chart({ data, tooltip, setTooltip }) {
  const W = 560, H = 220
  const padL = 56, padR = 20, padT = 16, padB = 36
  const cW = W - padL - padR
  const cH = H - padT - padB
  const n = data.length

  const maxVal = Math.max(...data.flatMap(d => [d.omzet, Math.max(d.margin, 0)]), 1)

  const xPos = (i) => padL + (n === 1 ? cW / 2 : (i / (n - 1)) * cW)
  const yPos = (v) => padT + cH - (Math.max(v, 0) / maxVal) * cH

  // Build smooth paths
  const buildPath = (vals) => {
    if (n === 1) return `M ${xPos(0)} ${yPos(vals[0])}`
    return vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`).join(' ')
  }

  const omzetPath = buildPath(data.map(d => d.omzet))
  const marginPath = buildPath(data.map(d => Math.max(d.margin, 0)))

  // Build area fills
  const buildArea = (vals) => {
    const line = buildPath(vals)
    const baseY = yPos(0).toFixed(1)
    return `${line} L ${xPos(n - 1).toFixed(1)} ${baseY} L ${xPos(0).toFixed(1)} ${baseY} Z`
  }
  const omzetArea = buildArea(data.map(d => d.omzet))
  const marginArea = buildArea(data.map(d => Math.max(d.margin, 0)))

  // Y axis ticks (4 levels)
  const yTicks = [0, 0.33, 0.67, 1].map(t => Math.round(t * maxVal))

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-omzet)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--chart-omzet)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL} y1={yPos(t)} x2={W - padR} y2={yPos(t)}
              stroke="rgba(255,255,255,0.055)" strokeWidth={1}
              strokeDasharray={t === 0 ? 'none' : '3 4'}
            />
            <text
              x={padL - 7} y={yPos(t) + 3.5}
              textAnchor="end" fontSize={9.5} fill="rgba(255,255,255,0.28)"
              fontFamily="inherit"
            >
              {formatShort(t)}
            </text>
          </g>
        ))}

        {/* Area fills */}
        <path d={omzetArea} fill="url(#omzetGrad)" />
        <path d={marginArea} fill="url(#marginGrad)" />

        {/* Lines */}
        <path d={omzetPath} fill="none" stroke="var(--chart-omzet)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={marginPath} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + hover targets */}
        {data.map((d, i) => (
          <g key={i}>
            {/* Omzet dot */}
            <circle cx={xPos(i)} cy={yPos(d.omzet)} r={3.5} fill="var(--chart-omzet)" stroke="var(--bg-card)" strokeWidth={1.5} />
            {/* Margin dot */}
            <circle cx={xPos(i)} cy={yPos(Math.max(d.margin, 0))} r={3.5} fill="#22c55e" stroke="var(--bg-card)" strokeWidth={1.5} />

            {/* X label */}
            <text
              x={xPos(i)} y={H - 6}
              textAnchor="middle" fontSize={10} fill={tooltip?.i === i ? 'var(--text-primary)' : 'rgba(255,255,255,0.35)'}
              fontFamily="inherit"
            >
              {d.label}
            </text>

            {/* Hover column */}
            <rect
              x={xPos(i) - (n > 1 ? cW / (n - 1) / 2 : cW / 2)}
              y={padT} width={n > 1 ? cW / (n - 1) : cW} height={cH}
              fill="transparent"
              style={{ cursor: 'default' }}
              onMouseEnter={() => setTooltip({ ...d, i })}
              onMouseLeave={() => setTooltip(null)}
            />

            {/* Hover line */}
            {tooltip?.i === i && (
              <line
                x1={xPos(i)} y1={padT} x2={xPos(i)} y2={padT + cH}
                stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3 3"
              />
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <TooltipBox tooltip={tooltip} n={n} xPos={xPos} cW={cW} padL={padL} W={W} />
      )}
    </div>
  )
}

function TooltipBox({ tooltip, n, xPos, cW, padL, W }) {
  const pct = ((xPos(tooltip.i) - padL) / cW) * 100
  const alignRight = pct > 65
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: `${pct}%`,
      transform: alignRight ? 'translateX(-100%)' : 'translateX(8px)',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-hover)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: 12,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      zIndex: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      minWidth: 170,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontSize: 13 }}>
        {tooltip.label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--text-muted)' }}>Omzet</span>
          <span style={{ color: 'var(--chart-omzet)', fontWeight: 600 }}>{formatIDR(tooltip.omzet)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--text-muted)' }}>Perkiraan untung</span>
          <span style={{ color: tooltip.margin >= 0 ? '#22c55e' : 'var(--error)', fontWeight: 600 }}>
            {formatIDR(tooltip.margin)}
          </span>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 6, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Trx</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{tooltip.trx} pelanggan</span>
        </div>
      </div>
    </div>
  )
}
