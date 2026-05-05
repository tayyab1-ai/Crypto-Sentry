export default function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (!values || values.length < 2) {
    // Sirf ek dashed line — koi fake data nahi
    return (
      <svg width="64" height="28" viewBox="0 0 64 28" fill="none">
        <line
          x1="4" y1="14" x2="60" y2="14"
          stroke="#1e2b1e" strokeWidth="1.5" strokeDasharray="3 3"
        />
      </svg>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 64
  const h = 28
  const pad = 3

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return [x, y] as [number, number]
  })

  const linePath = `M ${points.map(([x, y]) => `${x},${y}`).join(' L ')}`
  const areaPath = `M ${pad},${h - pad} L ${points.map(([x, y]) => `${x},${y}`).join(' L ')} L ${w - pad},${h - pad} Z`

  const color = positive ? '#22c55e' : '#ef4444'
  const areaFill = positive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'

  const lastX = points[points.length - 1][0]
  const lastY = points[points.length - 1][1]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={areaPath} fill={areaFill} />
      <path d={linePath} stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  )
}
