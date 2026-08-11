import { useEffect, useRef } from 'react'

export type HolePhase = 'drift' | 'pull' | 'hold' | 'collapse'

interface Props {
  phase: HolePhase
  /** Viewport centre of the button — where everything is dragged to. */
  target: () => { x: number; y: number } | null
}

const GLYPHS = ['♪', '♫', '♬', '♩', '𝄞', '✦', '◆', '•']

interface Particle {
  x: number; y: number
  vx: number; vy: number
  /** 0.35 (far) … 1.15 (near). Drives size, brightness and how hard it is pulled. */
  depth: number
  size: number
  glyph: string
  alpha: number
  baseAlpha: number
  spin: number
  spinRate: number
  orbitR: number
  orbitA: number
  orbitSpeed: number
  captured: boolean
  dead: boolean
}

/** A short bright flash where a note crosses the event horizon. */
interface Flash { x: number; y: number; age: number; life: number; size: number }

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInCubic  = (t: number) => t * t * t

/**
 * The field of music notes behind the auth card, and the black hole the submit
 * button turns into.
 *
 * Notes worth knowing:
 * • The canvas always sits *behind* the card. The card thins out while the
 *   animation runs so the swirl reads through it.
 * • Trails come from an alpha-eating `destination-out` fill rather than a black
 *   one, so the canvas stays transparent and never darkens the page.
 * • Particles carry a depth value: nearer ones are bigger, brighter and fall
 *   faster, which gives the field parallax instead of looking like flat confetti.
 * • While falling, glyphs align to their direction of travel and stretch with
 *   speed, so fast notes smear into streaks.
 */
export default function BlackHole({ phase, target }: Props) {
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
    let dpr = 1
    let parts: Particle[] = []
    let flashes: Flash[] = []
    /** Cached so the render loop reads layout once per resize, not twice a frame. */
    let canvasLeft = 0
    let canvasTop = 0

    const spawn = (seedAnywhere = true): Particle => {
      const depth = 0.35 + Math.random() * 0.8
      const baseAlpha = (0.10 + Math.random() * 0.34) * (0.55 + depth * 0.6)
      return {
        x: seedAnywhere ? Math.random() * width : Math.random() * width,
        y: seedAnywhere ? Math.random() * height : Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3 * depth,
        vy: ((Math.random() - 0.5) * 0.3 - 0.06) * depth,
        depth,
        size: (7 + Math.random() * 13) * (0.6 + depth * 0.7),
        glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        alpha: baseAlpha,
        baseAlpha,
        spin: Math.random() * Math.PI * 2,
        spinRate: (Math.random() - 0.5) * 0.01,
        orbitR: 0,
        orbitA: 0,
        orbitSpeed: 0,
        captured: false,
        dead: false,
      }
    }

    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      canvasLeft = rect.left
      canvasTop = rect.top
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextW = canvas.clientWidth  || window.innerWidth
      const nextH = canvas.clientHeight || window.innerHeight
      const changed = Math.abs(nextW - width) > 2 || Math.abs(nextH - height) > 2
      width = nextW
      height = nextH
      canvas.width  = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      measure()

      // Re-seed on a real size change: the pane can lay out at zero size on the
      // first frame, and particles seeded then would sit in the corner forever.
      if (changed && !reduced) {
        const count = Math.round(Math.min(240, Math.max(100, (width * height) / 7200)))
        parts = Array.from({ length: count }, () => spawn())
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', measure, { passive: true })
    const settle = setTimeout(resize, 120)

    let raf = 0
    let lastPhase: HolePhase = phaseRef.current

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)

      const currentPhase = phaseRef.current
      const elapsed = now - sinceRef.current
      const active = currentPhase !== 'drift'

      if (currentPhase !== lastPhase) {
        // Fire the shockwave the moment a collapse begins.
        if (currentPhase === 'collapse') flashes.push({ x: -1, y: -1, age: 0, life: 620, size: 0 })
        lastPhase = currentPhase
      }

      /* Trails: eat a fraction of the existing alpha. Never paints anything, so
         the canvas stays transparent over whatever is behind it. */
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = active ? 'rgba(0,0,0,0.26)' : 'rgba(0,0,0,0.42)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const box = target()
      const tx = box ? box.x - canvasLeft : width / 2
      const ty = box ? box.y - canvasTop  : height / 2

      /* Accretion glow. Eased so it swells rather than snapping on. */
      if (currentPhase === 'pull' || currentPhase === 'hold') {
        const grow = currentPhase === 'hold' ? 1 : easeOutCubic(Math.min(1, elapsed / 650))
        const pulse = currentPhase === 'hold' ? 1 + Math.sin(now / 260) * 0.06 : 1
        const radius = 118 * grow * pulse
        const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, radius)
        g.addColorStop(0, `rgba(255,255,255,${0.17 * grow})`)
        g.addColorStop(0.4, `rgba(255,255,255,${0.05 * grow})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(tx, ty, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }

      for (const p of parts) {
        if (p.dead) continue

        let speed = 0
        let heading = 0
        let aligned = false

        if (currentPhase === 'drift') {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -40) p.x = width + 40
          if (p.x > width + 40) p.x = -40
          if (p.y < -40) p.y = height + 40
          if (p.y > height + 40) p.y = -40
          p.captured = false
          p.alpha += (p.baseAlpha - p.alpha) * 0.05
          p.spin += p.spinRate
        }

        if (currentPhase === 'pull' && !p.captured) {
          const dx = p.x - tx
          const dy = p.y - ty
          let r = Math.hypot(dx, dy) || 1
          let a = Math.atan2(dy, dx)

          const t = Math.min(1, elapsed / 900)
          const shake = elapsed < 300 ? (1 - elapsed / 300) * 5 * p.depth : 0

          /* Radius driven proportionally so far corners keep up, angle faster
             the closer it gets — an orbit collapsing, not a straight fall.
             Depth makes nearer notes fall harder. */
          const pull = 0.75 + p.depth * 0.5
          const inward  = ((0.02 + 0.14 * easeInCubic(t)) * r + (1 + 7 * t)) * pull
          const angular = (0.012 + 0.12 * t) * (1 + 160 / (r + 90))

          const prevX = p.x, prevY = p.y
          r = Math.max(0, r - inward)
          a += angular
          p.x = tx + Math.cos(a) * r + (Math.random() - 0.5) * shake
          p.y = ty + Math.sin(a) * r + (Math.random() - 0.5) * shake

          // Brighten as it accelerates — the disc glows hottest near the edge.
          p.alpha = Math.min(0.95, p.baseAlpha + (1 - r / (width * 0.5)) * 0.5)

          const mx = p.x - prevX, my = p.y - prevY
          speed = Math.hypot(mx, my)
          heading = Math.atan2(my, mx)
          aligned = true

          if (r < 18) {
            p.captured = true
            p.orbitR = 7 + Math.random() * 11
            p.orbitA = a
            p.orbitSpeed = (0.18 + Math.random() * 0.14) * (0.7 + p.depth * 0.5)
          }
        }

        if ((currentPhase === 'pull' || currentPhase === 'hold') && p.captured) {
          p.orbitA += p.orbitSpeed
          const settleTo = currentPhase === 'hold' ? 11 : 9
          p.orbitR += (settleTo - p.orbitR) * 0.07
          const prevX = p.x, prevY = p.y
          p.x = tx + Math.cos(p.orbitA) * p.orbitR
          p.y = ty + Math.sin(p.orbitA) * p.orbitR
          p.alpha += ((currentPhase === 'hold' ? 0.9 : 0.75) - p.alpha) * 0.1
          speed = Math.hypot(p.x - prevX, p.y - prevY)
          heading = p.orbitA + Math.PI / 2
          aligned = true

          /* Crossing the horizon: the tightest orbits are swallowed with a
             flash, so the ring keeps churning instead of freezing solid. */
          if (currentPhase === 'hold' && p.orbitR < 12 && Math.random() < 0.006) {
            p.dead = true
            flashes.push({ x: p.x, y: p.y, age: 0, life: 320, size: p.size })
          }
        }

        if (currentPhase === 'hold' && !p.captured) {
          const dx = tx - p.x, dy = ty - p.y
          const dist = Math.hypot(dx, dy) || 1
          p.x += (dx / dist) * 5
          p.y += (dy / dist) * 5
          speed = 5
          heading = Math.atan2(dy, dx)
          aligned = true
          if (dist < 24) {
            p.captured = true
            p.orbitR = 8 + Math.random() * 13
            p.orbitA = Math.random() * Math.PI * 2
            p.orbitSpeed = 0.14 + Math.random() * 0.12
          }
        }

        if (currentPhase === 'collapse') {
          if (p.captured) {
            p.captured = false
            const angle = Math.random() * Math.PI * 2
            const force = (11 + Math.random() * 18) * (0.7 + p.depth * 0.5)
            p.vx = Math.cos(angle) * force
            p.vy = Math.sin(angle) * force
            p.alpha = Math.min(1, p.alpha + 0.35)
          } else if (elapsed < 60) {
            const angle = Math.atan2(p.y - ty, p.x - tx)
            const force = (7 + Math.random() * 13) * (0.7 + p.depth * 0.5)
            p.vx = Math.cos(angle) * force
            p.vy = Math.sin(angle) * force
          }
          p.x += p.vx
          p.y += p.vy
          p.vx *= 0.967
          p.vy *= 0.967
          p.spin += (p.spinRate = p.spinRate * 1.03 + 0.012)
          p.alpha *= 0.976
          speed = Math.hypot(p.vx, p.vy)
          heading = Math.atan2(p.vy, p.vx)
          aligned = speed > 2
          if (p.alpha < 0.02) p.dead = true
        }

        /* Draw. Fast notes align to their heading and stretch into streaks;
           slow ones keep tumbling. */
        ctx.save()
        ctx.translate(p.x, p.y)
        if (aligned && speed > 1.2) {
          ctx.rotate(heading)
          ctx.scale(1 + Math.min(speed * 0.09, 2.6), 1)
        } else {
          ctx.rotate(p.spin)
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha))
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `${p.size}px "Bebas Neue", Georgia, serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (active) {
          ctx.shadowColor = 'rgba(255,255,255,0.95)'
          ctx.shadowBlur = currentPhase === 'collapse' ? 20 : 14
        }
        ctx.fillText(p.glyph, 0, 0)
        ctx.restore()
      }

      /* Flashes and the collapse shockwave. */
      if (flashes.length) {
        ctx.globalCompositeOperation = 'lighter'
        for (const f of flashes) {
          f.age += 16.7
          const k = Math.min(1, f.age / f.life)
          const fade = 1 - k
          if (f.x < 0) {
            // Shockwave: a ring sweeping out from the hole.
            const r = easeOutCubic(k) * Math.max(width, height) * 0.55
            ctx.strokeStyle = `rgba(255,255,255,${0.34 * fade * fade})`
            ctx.lineWidth = 2 + 10 * fade
            ctx.beginPath()
            ctx.arc(tx, ty, r, 0, Math.PI * 2)
            ctx.stroke()
          } else {
            const r = f.size * (0.5 + k * 2.4)
            ctx.fillStyle = `rgba(255,255,255,${0.5 * fade})`
            ctx.beginPath()
            ctx.arc(f.x, f.y, r, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        flashes = flashes.filter(f => f.age < f.life)
        ctx.globalCompositeOperation = 'source-over'
      }

      // Quietly restock whatever the hole ate or the collapse blew away.
      if (currentPhase === 'drift') {
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].dead) parts[i] = spawn()
        }
      }

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settle)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', measure)
    }
  }, [target])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        // Always behind the card, so nothing ever sprays across the interface.
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}
