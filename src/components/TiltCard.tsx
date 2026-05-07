import { useRef, type ReactNode } from 'react'
import styles from './TiltCard.module.css'

interface Props {
  children: ReactNode
  className?: string
  maxTilt?: number      // degrees
  glareOpacity?: number // 0–1
  scale?: number
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 12,
  glareOpacity = 0.18,
  scale = 1.03,
}: Props) {
  const cardRef  = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect  = card.getBoundingClientRect()
    const cx    = rect.left + rect.width  / 2
    const cy    = rect.top  + rect.height / 2
    const dx    = e.clientX - cx
    const dy    = e.clientY - cy
    const rotX  = -(dy / (rect.height / 2)) * maxTilt
    const rotY  =  (dx / (rect.width  / 2)) * maxTilt

    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`

    // Move glare in opposite direction for realism
    if (glareRef.current) {
      const glareX = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1)
      const glareY = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1)
      glareRef.current.style.background =
        `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,${glareOpacity}), transparent 65%)`
    }
  }

  const onMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)`
    if (glareRef.current) glareRef.current.style.background = 'none'
  }

  return (
    <div
      ref={cardRef}
      className={`${styles.tiltCard} ${className}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Glare overlay */}
      <div ref={glareRef} className={styles.glare} aria-hidden />
      {children}
    </div>
  )
}
