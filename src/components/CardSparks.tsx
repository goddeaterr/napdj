import { useEffect, useRef, type ReactNode } from 'react'
import styles from './CardSparks.module.css'

const GLYPHS = ['♪', '♫', '♬', '♩', '✦', '◆']

interface Spark {
  x: number; y: number
  vx: number; vy: number
  life: number
  size: number
  glyph: string
  spin: number
  spinRate: number
}

/**
 * Wraps a card and throws music notes off its outline when the pointer arrives
 * or clicks — the same family of motion as the black hole on the auth screens,
 * scaled down to a gesture.
 *
 * The notes leave from points along the card's edge and travel outward, so the
 * canvas is deliberately larger than the card: it extends PAD pixels past every
 * side, otherwise anything leaving the border would be clipped immediately.
 *
 * The canvas only runs while sparks are alive. With nothing on screen the loop
 * stops completely, so a page of these costs nothing at rest.
 */
export default function CardSparks({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparks = useRef<Spark[]>([])
  const raf = useRef(0)
  const running = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    /** How far past the card the notes are allowed to travel. */
    const PAD = 110
    let w = 0, h = 0

    const resize = () => {
      w = host.clientWidth + PAD * 2
      h = host.clientHeight + PAD * 2
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const frame = () => {
      ctx.clearRect(0, 0, w, h)

      for (const s of sparks.current) {
        s.x += s.vx
        s.y += s.vy
        s.vx *= 0.972
        s.vy *= 0.972
        s.spin += s.spinRate
        s.life -= 0.016

        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.spin)
        ctx.globalAlpha = Math.max(0, Math.min(1, s.life))
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `${s.size}px "Bebas Neue", Georgia, serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(s.glyph, 0, 0)
        ctx.restore()
      }

      sparks.current = sparks.current.filter(s => s.life > 0)

      // Stop entirely when there is nothing left to draw.
      if (sparks.current.length) {
        raf.current = requestAnimationFrame(frame)
      } else {
        running.current = false
        ctx.clearRect(0, 0, w, h)
      }
    }

    /**
     * Picks a random point on the card's border and the outward direction at
     * that point, in canvas coordinates. The card sits inset by PAD, so its
     * edges run from PAD to PAD + cardWidth / cardHeight.
     */
    const pointOnOutline = () => {
      const cw = host.clientWidth
      const ch = host.clientHeight
      const perimeter = (cw + ch) * 2
      let d = Math.random() * perimeter

      if (d < cw) return { x: PAD + d, y: PAD, nx: 0, ny: -1 }                 // top
      d -= cw
      if (d < ch) return { x: PAD + cw, y: PAD + d, nx: 1, ny: 0 }             // right
      d -= ch
      if (d < cw) return { x: PAD + cw - d, y: PAD + ch, nx: 0, ny: 1 }        // bottom
      d -= cw
      return { x: PAD, y: PAD + ch - d, nx: -1, ny: 0 }                        // left
    }

    const emit = (count: number, force: number) => {
      for (let i = 0; i < count; i++) {
        const p = pointOnOutline()
        // Mostly straight out from the edge, with a little spread either side.
        const spread = (Math.random() - 0.5) * 1.1
        const angle = Math.atan2(p.ny, p.nx) + spread
        const speed = 1.2 + Math.random() * force

        sparks.current.push({
          x: p.x, y: p.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.7 + Math.random() * 0.6,
          size: 9 + Math.random() * 9,
          glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          spin: Math.random() * Math.PI * 2,
          spinRate: (Math.random() - 0.5) * 0.15,
        })
      }
      if (!running.current) {
        running.current = true
        raf.current = requestAnimationFrame(frame)
      }
    }

    // A handful on arrival, a bigger scatter on click. Both leave from the
    // outline rather than the pointer, so the whole card reacts.
    const onEnter = () => emit(10, 2.4)
    const onDown  = () => emit(26, 5.0)

    host.addEventListener('pointerenter', onEnter)
    host.addEventListener('pointerdown', onDown)

    return () => {
      cancelAnimationFrame(raf.current)
      ro.disconnect()
      host.removeEventListener('pointerenter', onEnter)
      host.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <div ref={hostRef} className={styles.host}>
      {children}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  )
}
