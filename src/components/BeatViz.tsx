import styles from './BeatViz.module.css'

const BAR_COUNT = 48

// Pre-compute bar heights and animation params deterministically
const BARS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const base = 15 + Math.abs(Math.sin(i * 0.55) * 55) + Math.abs(Math.cos(i * 0.31) * 25)
  const dur  = 0.45 + Math.abs(Math.sin(i * 0.9)) * 0.55
  const del  = (i * 0.035) % 1.2
  // Color: purple left, pink center, cyan right
  const t    = i / (BAR_COUNT - 1)
  const color =
    t < 0.33 ? '#9B30FF' :
    t < 0.5  ? '#BF5FFF' :
    t < 0.66 ? '#FF2D78' :
               '#00C8FF'
  return { base, dur, del, color }
})

interface Props {
  /** Label shown above the visualizer */
  label?: string
  /** How tall in px */
  height?: number
}

export default function BeatViz({ label, height = 80 }: Props) {
  return (
    <div className={styles.wrap} style={{ height }}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.bars}>
        {BARS.map((b, i) => (
          <div
            key={i}
            className={styles.bar}
            style={{
              '--base': `${b.base}%`,
              '--dur':  `${b.dur}s`,
              '--del':  `${b.del}s`,
              '--col':  b.color,
              maxHeight:`${b.base + 30}%`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      {/* Mirror below — reflected flipped */}
      <div className={`${styles.bars} ${styles.mirror}`}>
        {BARS.map((b, i) => (
          <div
            key={i}
            className={styles.bar}
            style={{
              '--base': `${b.base * 0.45}%`,
              '--dur':  `${b.dur}s`,
              '--del':  `${b.del + 0.12}s`,
              '--col':  b.color,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
