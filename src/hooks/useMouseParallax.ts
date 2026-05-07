import { useEffect, useState } from 'react'

export function useMouseParallax(intensity: number = 0.02) {
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * intensity * 100
      const y = (e.clientY / window.innerHeight - 0.5) * intensity * 100
      setPos({ x, y })
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [intensity])

  return pos
}
