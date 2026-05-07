import { useEffect, useRef } from 'react'
import styles from './FloatingNotes.module.css'

const NOTES   = ['♪', '♫', '♩', '♬', '♭', '♮']
const COUNT   = 7

interface Note {
  id: number
  char: string
  x: number        // % left
  delay: number    // s
  dur: number      // s
  size: number     // px
  color: string
  rotate: number   // deg end
}

export default function FloatingNotes() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Build static note data once
  const notes: Note[] = Array.from({ length: COUNT }, (_, i) => ({
    id:     i,
    char:   NOTES[i % NOTES.length],
    x:      8 + (i * 9.2) % 84,
    delay:  (i * 1.37) % 7,
    dur:    5.5 + (i * 0.73) % 4,
    size:   14 + (i * 3) % 18,
    color:  i % 3 === 0 ? '#9B30FF' : i % 3 === 1 ? '#FF2D78' : '#BF5FFF',
    rotate: -20 + (i * 13) % 40,
  }))

  return (
    <div ref={containerRef} className={styles.wrap} aria-hidden>
      {notes.map(n => (
        <span
          key={n.id}
          className={styles.note}
          style={{
            left:            `${n.x}%`,
            fontSize:        `${n.size}px`,
            color:           n.color,
            animationDuration:`${n.dur}s`,
            animationDelay:  `${n.delay}s`,
            '--rotate':      `${n.rotate}deg`,
            textShadow:      `0 0 12px ${n.color}`,
          } as React.CSSProperties}
        >
          {n.char}
        </span>
      ))}
    </div>
  )
}
