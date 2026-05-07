import { useRef, type ReactNode } from 'react'
import styles from './MagneticButton.module.css'

interface Props {
  children: ReactNode
  /** Radius (px) within which the magnet activates */
  radius?: number
  /** How strongly it pulls (0–1) */
  strength?: number
  className?: string
  onClick?: () => void
}

export default function MagneticButton({
  children,
  radius   = 110,
  strength = 0.42,
  className = '',
  onClick,
}: Props) {
  const btnRef  = useRef<HTMLDivElement>(null)
  const animRef = useRef(0)
  const pos     = useRef({ x: 0, y: 0 })
  const target  = useRef({ x: 0, y: 0 })

  const onMouseMove = (e: React.MouseEvent) => {
    const btn  = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const cx   = rect.left + rect.width  / 2
    const cy   = rect.top  + rect.height / 2
    const dx   = e.clientX - cx
    const dy   = e.clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < radius) {
      const factor    = (1 - dist / radius) * strength
      target.current  = { x: dx * factor, y: dy * factor }
    }

    // Cancel any spring-back
    cancelAnimationFrame(animRef.current)
    lerp()
  }

  const onMouseLeave = () => {
    target.current = { x: 0, y: 0 }
    cancelAnimationFrame(animRef.current)
    springBack()
  }

  const lerp = () => {
    pos.current.x += (target.current.x - pos.current.x) * 0.18
    pos.current.y += (target.current.y - pos.current.y) * 0.18
    apply()
    animRef.current = requestAnimationFrame(lerp)
  }

  const springBack = () => {
    pos.current.x += (0 - pos.current.x) * 0.12
    pos.current.y += (0 - pos.current.y) * 0.12
    apply()
    if (Math.abs(pos.current.x) > 0.3 || Math.abs(pos.current.y) > 0.3) {
      animRef.current = requestAnimationFrame(springBack)
    } else {
      pos.current = { x: 0, y: 0 }
      apply()
    }
  }

  const apply = () => {
    if (!btnRef.current) return
    btnRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`
  }

  return (
    <div
      ref={btnRef}
      className={`${styles.wrap} ${className}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
