import { useEffect, useRef, useState } from 'react'

/**
 * Counts from 0 → target once `active` becomes true.
 * Uses requestAnimationFrame with ease-out-cubic for smooth feel.
 */
export function useCountUp(
  target: number,
  active: boolean,
  duration = 1600,
  decimals = 0,
): string {
  const [value, setValue]   = useState(0)
  const rafRef   = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const doneRef  = useRef(false)

  useEffect(() => {
    if (!active || doneRef.current) return

    const animate = (now: number) => {
      if (!startRef.current) startRef.current = now
      const elapsed  = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      // ease-out expo: fast burst then glides to final value
      const eased    = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        doneRef.current = true
        setValue(target)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active, target, duration, decimals])

  return value.toFixed(decimals)
}
