import { useEffect, useRef } from 'react'

interface Ripple {
  x: number; y: number
  r: number; maxR: number
  life: number
  color: string
}

const COLORS = [
  'rgba(155,48,255,',
  'rgba(255,45,155,',
  'rgba(0,200,255,',
]

export default function ClickRipple() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ripples   = useRef<Ripple[]>([])
  const frameRef  = useRef(0)

  useEffect(() => {
    const canvas  = document.createElement('canvas')
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99985'
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d')!

    const onResize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    const onClick = (e: MouseEvent) => {
      // Don't fire inside input/select/textarea
      if ((e.target as HTMLElement).closest('input,textarea,select,button')) {
        // Still fire but smaller for buttons
      }
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      ripples.current.push({ x: e.clientX, y: e.clientY, r: 0, maxR: 160, life: 1, color })
      // Double ripple with slight delay
      setTimeout(() => {
        ripples.current.push({ x: e.clientX, y: e.clientY, r: 0, maxR: 240, life: 0.6, color })
      }, 80)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('click',  onClick)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ripples.current = ripples.current.filter(rp => rp.life > 0.01)
      ripples.current.forEach(rp => {
        const progress = rp.r / rp.maxR
        const alpha    = rp.life * (1 - Math.pow(progress, 0.7)) * 0.8

        // Outer glow ring
        const g = ctx.createRadialGradient(rp.x, rp.y, Math.max(0, rp.r - 12), rp.x, rp.y, rp.r + 8)
        g.addColorStop(0,   `${rp.color}0)`)
        g.addColorStop(0.5, `${rp.color}${(alpha * 0.4).toFixed(3)})`)
        g.addColorStop(1,   `${rp.color}0)`)
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r + 8, 0, Math.PI * 2)
        if (rp.r > 12) ctx.arc(rp.x, rp.y, rp.r - 12, 0, Math.PI * 2, true)
        ctx.fill()

        // Crisp ring
        ctx.save()
        ctx.globalAlpha = alpha * 1.5
        ctx.strokeStyle = `${rp.color}1)`
        ctx.lineWidth   = 1.5
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()

        // Advance
        rp.r   += (rp.maxR - rp.r) * 0.1 + 2.5
        rp.life -= 0.032
      })

      frameRef.current = requestAnimationFrame(draw)
    }
    frameRef.current = requestAnimationFrame(draw)

    return () => {
      canvas.remove()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('click',  onClick)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return null
}
