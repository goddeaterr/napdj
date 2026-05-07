import { useEffect, useRef, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?<>[]{}~'

interface Props {
  text: string
  className?: string
  /** How often to trigger a glitch (ms) */
  interval?: number
  /** Duration of each glitch burst (ms) */
  duration?: number
  /** How many chars to scramble at once */
  intensity?: number
  tag?: 'span' | 'h1' | 'h2' | 'div'
}

export default function TextGlitch({
  text,
  className,
  interval = 3200,
  duration = 650,
  intensity = 4,
  tag: Tag = 'span',
}: Props) {
  const [display, setDisplay] = useState(text)
  const glitching = useRef(false)
  const frameRef  = useRef(0)

  useEffect(() => {
    const triggerGlitch = () => {
      if (glitching.current) return
      glitching.current = true

      const start    = performance.now()
      const letters  = text.split('')

      const tick = (now: number) => {
        const elapsed  = now - start
        const progress = elapsed / duration   // 0 → 1

        if (progress >= 1) {
          setDisplay(text)
          glitching.current = false
          return
        }

        // Resolve from left to right as progress increases
        const resolvedCount = Math.floor(progress * letters.length)
        const scrambled = letters.map((char, i) => {
          if (char === ' ') return ' '
          if (i < resolvedCount) return char
          // Only scramble a portion (intensity chars at a time)
          if (i < resolvedCount + intensity) {
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          }
          return char
        })

        setDisplay(scrambled.join(''))
        frameRef.current = requestAnimationFrame(tick)
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    // Initial delay so it doesn't fire immediately on load
    const startDelay = setTimeout(triggerGlitch, 1800)
    const id = setInterval(triggerGlitch, interval)

    return () => {
      clearTimeout(startDelay)
      clearInterval(id)
      cancelAnimationFrame(frameRef.current)
    }
  }, [text, interval, duration, intensity])

  // Sync when language changes
  useEffect(() => {
    if (!glitching.current) setDisplay(text)
  }, [text])

  return <Tag className={className}>{display}</Tag>
}
