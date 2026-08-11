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
 * Wraps a card and throws a few music notes off it when the pointer arrives or
 * clicks — the same family of motion as the black hole on the auth screens,
 * scaled down to a gesture.
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
    let w = 0, h = 0

    const resize = () => {
      w = host.clientWidth
      h = host.clientHeight
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
        s.vy += 0.06          // a little weight, so they arc rather than fly flat
        s.vx *= 0.985
        s.vy *= 0.985
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

    const emit = (count: number, x: number, y: number, force: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (0.8 + Math.random() * force)
        sparks.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
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

    const localPoint = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    // A handful on arrival, a bigger scatter on click.
    const onEnter = (e: PointerEvent) => { const p = localPoint(e); emit(7, p.x, p.y, 2.2) }
    const onDown  = (e: PointerEvent) => { const p = localPoint(e); emit(16, p.x, p.y, 4.5) }

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
