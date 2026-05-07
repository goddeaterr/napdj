import { useRef, useState, useEffect } from 'react'
import { getAudioContext, AmbientEngine } from '../lib/audio'
import type { AudioCtxRef } from '../lib/audio'
import styles from './AmbientPlayer.module.css'

interface Props {
  audioCtx: AudioCtxRef
  compact?: boolean
}

export default function AmbientPlayer({ audioCtx, compact = false }: Props) {
  const engine   = useRef<AmbientEngine | null>(null)
  const [on, setOn]     = useState(false)
  const [vol, setVol]   = useState(0.45)
  const [tick, setTick] = useState(0)

  // Animate bars when playing
  useEffect(() => {
    if (!on) return
    const id = setInterval(() => setTick(t => t + 1), 120)
    return () => clearInterval(id)
  }, [on])

  const toggle = () => {
    const ctx = getAudioContext(audioCtx)
    if (!engine.current) engine.current = new AmbientEngine(ctx)
    if (on) { engine.current.stop() } else { engine.current.start() }
    setOn(v => !v)
  }

  const changeVol = (v: number) => {
    setVol(v)
    engine.current?.setVolume(v)
  }

  if (compact) {
    // Compact form for mobile drawer
    return (
      <div className={styles.compact}>
        <button
          className={`${styles.compactBtn} ${on ? styles.compactOn : ''}`}
          onClick={toggle}
        >
          {on ? '⏸' : '▶'} <span>AMBIENT</span>
        </button>
        {on && (
          <input
            type="range" min="0" max="1" step="0.01" value={vol}
            className={styles.volSlider}
            style={{ '--c': '#9B30FF', '--v': `${vol * 100}%` } as React.CSSProperties}
            onChange={e => changeVol(+e.target.value)}
          />
        )}
      </div>
    )
  }

  const barHeights = Array.from({ length: 8 }, (_, i) =>
    on ? 15 + Math.abs(Math.sin(tick * 0.4 + i * 0.9)) * 70 : 10
  )

  return (
    <div className={`${styles.wrap} ${on ? styles.wrapOn : ''}`}>
      {/* Mini visualizer */}
      <div className={styles.viz} aria-hidden>
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={styles.bar}
            style={{
              height: `${h}%`,
              background: on
                ? (i % 3 === 0 ? '#9B30FF' : i % 3 === 1 ? '#FF2D78' : '#00F5FF')
                : 'rgba(255,255,255,0.1)',
              boxShadow: on && h > 50 ? `0 0 5px ${i%3===0?'#9B30FF':i%3===1?'#FF2D78':'#00F5FF'}` : 'none',
            }}
          />
        ))}
      </div>

      {/* Play/pause */}
      <button
        className={`${styles.btn} ${on ? styles.btnOn : ''}`}
        onClick={toggle}
        title={on ? 'Pause ambient' : 'Play ambient'}
        aria-label={on ? 'Pause ambient music' : 'Play ambient music'}
        aria-pressed={on}
      >
        <span className={styles.btnIcon}>{on ? '⏸' : '▶'}</span>
        <span className={styles.btnLabel}>AMBIENT</span>
      </button>

      {/* Volume — only when playing */}
      {on && (
        <input
          type="range" min="0" max="1" step="0.01" value={vol}
          className={styles.volSlider}
          style={{ '--c': '#9B30FF', '--v': `${vol * 100}%` } as React.CSSProperties}
          onChange={e => changeVol(+e.target.value)}
          aria-label="Ambient volume"
        />
      )}
    </div>
  )
}
