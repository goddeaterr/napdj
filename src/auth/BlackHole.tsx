import { useEffect, useRef } from 'react'

export type HolePhase = 'drift' | 'pull' | 'hold' | 'collapse'

interface Props {
  phase: HolePhase
  /** Viewport centre of the button — where everything is dragged to. */
  target: () => { x: number; y: number } | null
}

const GLYPHS = ['♪', '♫', '♬', '♩', '𝄞', '•', '◆', '✦']

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number
  glyph: string
  alpha: number
  spin: number
  spinRate: number
  orbitR: number
  orbitA: number
  orbitSpeed: number
  captured: boolean
  dead: boolean
}

/**
 * Music notes drifting behind the auth card. On submit they spin up, smear
 * into trails and stream into the button as it becomes a sphere. A correct
 * password keeps them in orbit; a wrong one throws them back out.
 *
 * The blur is motion blur: instead of clearing the canvas each frame we paint
 * a translucent black over it, so the previous frames fade out behind the new
 * one. Cheaper than a real blur filter and it reads as speed.
 */
export default function BlackHole({ phase, target }: Props) {
  /* The card is opaque and sits above the drifting field. Once the hole is
     live the particles have to pass over it, otherwise everything vanishes
     behind the card exactly when it converges on the button. */
  const above = phase !== 'drift'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef  = useRef<HolePhase>(phase)
  const sinceRef  = useRef<number>(performance.now())

  useEffect(() => {
    phaseRef.current = phase
    sinceRef.current = performance.now()
  }, [phase])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let parts: Particle[] = []

    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25 - 0.05,
      size: 9 + Math.random() * 17,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      alpha: 0.16 + Math.random() * 0.45,
      spin: Math.random() * Math.PI * 2,
      spinRate: (Math.random() - 0.5) * 0.012,
      orbitR: 0,
      orbitA: 0,
      orbitSpeed: 0,
      captured: false,
      dead: false,
    })

    /**
     * Sizes the canvas and seeds the field. Re-seeding on a real size change
     * matters: the pane can be laid out at zero size on the first frame, and
     * particles seeded then would all sit in the top-left corner forever.
     */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextW = canvas.clientWidth  || window.innerWidth
      const nextH = canvas.clientHeight || window.innerHeight
      const changed = Math.abs(nextW - width) > 2 || Math.abs(nextH - height) > 2
      width = nextW
      height = nextH
      canvas.width  = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (changed && !reduced) {
        const count = Math.round(Math.min(220, Math.max(90, (width * height) / 7800)))
        parts = Array.from({ length: count }, spawn)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    // The pane can gain its real size a frame or two after mount.
    const settle = setTimeout(resize, 120)

    let raf = 0

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)

      const currentPhase = phaseRef.current
      const elapsed = now - sinceRef.current
      const active = currentPhase !== 'drift'

      // Motion blur: fade the previous frame instead of wiping it. The faster
      // the phase, the longer the trails linger.
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = active ? 'rgba(10,10,10,0.22)' : 'rgba(10,10,10,0.38)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const box = target()
      const rect = canvas.getBoundingClientRect()
      const tx = box ? box.x - rect.left : width / 2
      const ty = box ? box.y - rect.top  : height / 2

      // Glowing accretion disc under everything once the hole is live.
      if (currentPhase === 'pull' || currentPhase === 'hold') {
        const grow = currentPhase === 'hold' ? 1 : Math.min(1, elapsed / 700)
        const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 150 * grow)
        g.addColorStop(0, 'rgba(255,255,255,0.22)')
        g.addColorStop(0.45, 'rgba(255,255,255,0.05)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(tx, ty, 150 * grow, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }

      for (const p of parts) {
        if (p.dead) continue

        if (currentPhase === 'drift') {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -30) p.x = width + 30
          if (p.x > width + 30) p.x = -30
          if (p.y < -30) p.y = height + 30
          if (p.y > height + 30) p.y = -30
          p.captured = false
        }

        if (currentPhase === 'pull') {
          /* Polar motion around the hole rather than force accumulation.
             Inverse-square gravity looks right on paper but barely moves a
             particle 400px away inside one second, so the radius is driven
             directly: it shrinks a little faster every frame, and the angle
             advances faster the closer the particle gets — which is what makes
             it read as an orbit collapsing rather than a straight fall. */
          const dx = p.x - tx
          const dy = p.y - ty
          let r = Math.hypot(dx, dy) || 1
          let a = Math.atan2(dy, dx)

          const t = Math.min(1, elapsed / 900)
          const shake = elapsed < 300 ? (1 - elapsed / 300) * 4 : 0

          /* The inward step is proportional to the radius, so a particle in a
             far corner covers ground as fast as a near one and the whole field
             lands within the pull. Cubed ramp keeps the first moments slow, so
             the shake reads before the fall. */
          const inward  = (0.02 + 0.14 * t * t * t) * r + (1 + 7 * t)
          const angular = (0.012 + 0.12 * t) * (1 + 160 / (r + 90))

          r = Math.max(0, r - inward)
          a += angular

          p.x = tx + Math.cos(a) * r + (Math.random() - 0.5) * shake
          p.y = ty + Math.sin(a) * r + (Math.random() - 0.5) * shake
          p.spinRate += 0.02

          // Remember which way it was heading, capped, so a collapse can fling
          // it back out without inheriting a huge inward step.
          const carry = Math.min(inward, 14)
          p.vx = Math.cos(a) * -carry
          p.vy = Math.sin(a) * -carry

          if (r < 24) {
            p.captured = true
            p.orbitR = 9 + Math.random() * 15
            p.orbitA = a
            p.orbitSpeed = 0.18 + Math.random() * 0.14
            p.alpha *= 0.99
          }
        }

        if (currentPhase === 'pull' && p.captured) {
          p.orbitA += p.orbitSpeed
          p.orbitR += (12 - p.orbitR) * 0.08
          p.x = tx + Math.cos(p.orbitA) * p.orbitR
          p.y = ty + Math.sin(p.orbitA) * p.orbitR
        }

        if (currentPhase === 'hold') {
          if (!p.captured) {
            const dx = tx - p.x, dy = ty - p.y
            const dist = Math.hypot(dx, dy) || 1
            p.x += (dx / dist) * 4
            p.y += (dy / dist) * 4
            if (dist < 32) {
              p.captured = true
              p.orbitR = 11 + Math.random() * 18
              p.orbitA = Math.random() * Math.PI * 2
              p.orbitSpeed = 0.14 + Math.random() * 0.12
            }
          } else {
            p.orbitA += p.orbitSpeed
            p.orbitR += (15 - p.orbitR) * 0.06
            p.x = tx + Math.cos(p.orbitA) * p.orbitR
            p.y = ty + Math.sin(p.orbitA) * p.orbitR
            p.alpha += (0.85 - p.alpha) * 0.09
            p.spinRate = 0.24
          }
        }

        if (currentPhase === 'collapse') {
          if (p.captured) {
            p.captured = false
            const angle = Math.random() * Math.PI * 2
            const force = 11 + Math.random() * 18
            p.vx = Math.cos(angle) * force
            p.vy = Math.sin(angle) * force
          } else if (elapsed < 60) {
            // Everything still falling gets thrown outward too.
            const angle = Math.atan2(p.y - ty, p.x - tx)
            const force = 7 + Math.random() * 13
            p.vx = Math.cos(angle) * force
            p.vy = Math.sin(angle) * force
          }
          p.x += p.vx
          p.y += p.vy
          p.vx *= 0.968
          p.vy *= 0.968
          p.spinRate = p.spinRate * 1.03 + 0.01
          p.alpha *= 0.978
          if (p.alpha < 0.02) p.dead = true
        }

        p.spin += p.spinRate

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.spin)
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha))
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `${p.size}px "Bebas Neue", Georgia, serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (active) {
          ctx.shadowColor = 'rgba(255,255,255,0.95)'
          ctx.shadowBlur = currentPhase === 'collapse' ? 22 : 16
        }
        ctx.fillText(p.glyph, 0, 0)
        ctx.restore()
      }

      // Restock the field once a collapse has blown everything away.
      if (currentPhase === 'drift' && parts.some(p => p.dead)) {
        parts = parts.map(p => (p.dead ? spawn() : p))
      }

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settle)
      window.removeEventListener('resize', resize)
    }
  }, [target])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: above ? 5 : 0,
      }}
    />
  )
}
