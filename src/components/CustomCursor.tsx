import { useEffect, useRef, useState } from 'react'
import styles from './CustomCursor.module.css'

const TRAIL_LENGTH = 16

export default function CustomCursor() {
  const dotRef      = useRef<HTMLDivElement>(null)
  const ringRef     = useRef<HTMLDivElement>(null)
  const trailCanvas = useRef<HTMLCanvasElement | null>(null)

  const posRef     = useRef({ x: -200, y: -200 })
  const ringPos    = useRef({ x: -200, y: -200 })
  // Trail positions ring buffer
  const trail      = useRef<Array<{ x: number; y: number }>>( Array(TRAIL_LENGTH).fill({ x: -200, y: -200 }) )
  const frameRef   = useRef(0)

  const [hovering, setHovering]  = useState(false)
  const [clicking, setClicking]  = useState(false)

  useEffect(() => {
    document.documentElement.style.cursor = 'none'

    // Canvas for the trail
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99990'
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)
    trailCanvas.current = canvas
    const ctx = canvas.getContext('2d')!

    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }
    const onDown  = () => setClicking(true)
    const onUp    = () => setClicking(false)

    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button,a,[role=button],input,textarea,select'))
        setHovering(true)
    }
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button,a,[role=button],input,textarea,select'))
        setHovering(false)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout',  onOut)

    const animate = () => {
      const dot  = dotRef.current
      const ring = ringRef.current
      const pos  = posRef.current

      // Shift trail
      trail.current = [{ ...pos }, ...trail.current.slice(0, TRAIL_LENGTH - 1)]

      // Draw trail on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      trail.current.forEach((p, i) => {
        if (p.x < -100) return
        const t      = 1 - i / TRAIL_LENGTH
        const size   = t * 5
        const alpha  = t * 0.45
        // Interpolate color purple→pink
        const r = Math.round(155 + (255 - 155) * (1 - t))
        const g = Math.round(48  + (45  - 48)  * (1 - t))
        const b = Math.round(255 + (155 - 255) * (1 - t))
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.fill()

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4)
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.5})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Dot — snaps
      if (dot) dot.style.transform = `translate(${pos.x - 5}px,${pos.y - 5}px)`

      // Ring — lerp
      ringPos.current.x += (pos.x - ringPos.current.x) * 0.1
      ringPos.current.y += (pos.y - ringPos.current.y) * 0.1
      if (ring) ring.style.transform = `translate(${ringPos.current.x - 22}px,${ringPos.current.y - 22}px)`

      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      document.documentElement.style.cursor = ''
      canvas.remove()
      window.removeEventListener('resize',    onResize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout',  onOut)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className={`${styles.dot} ${hovering ? styles.dotHover : ''} ${clicking ? styles.dotClick : ''}`}
      />
      <div
        ref={ringRef}
        className={`${styles.ring} ${hovering ? styles.ringHover : ''} ${clicking ? styles.ringClick : ''}`}
      />
    </>
  )
}
