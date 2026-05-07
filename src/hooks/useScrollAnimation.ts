import { useEffect, useRef, useState } from 'react'

export function useScrollAnimation<T extends HTMLElement>(threshold = 0.05, once = true) {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setIsVisible(true); if (once) obs.unobserve(el) }
      else if (!once) setIsVisible(false)
    }, { threshold, rootMargin: '0px 0px 40px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, once])
  return { ref, isVisible }
}
