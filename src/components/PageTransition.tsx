import { useEffect, useRef, useState } from 'react'
import NekoLogo from './NekoLogo'
import styles from './PageTransition.module.css'

/**
 * Covers the screen with the logo on first load and between pages.
 *
 * It runs on a timer rather than waiting for the next page to be ready: the
 * routes here are already-loaded chunks, so waiting would mean no cover at all
 * on fast machines and an inconsistent one on slow ones.
 */
export default function PageTransition({ token }: { token: string }) {
  // The first paint is covered, so nothing flashes in half-styled.
  const [state, setState] = useState<'in' | 'out' | 'idle'>('in')
  const first = useRef(true)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }

    if (first.current) {
      first.current = false
      // Opening: hold the logo briefly, then lift the curtain.
      timers.current.push(window.setTimeout(() => setState('out'), 620))
      timers.current.push(window.setTimeout(() => setState('idle'), 1320))
      return clear
    }

    // Route change: drop the curtain, then lift it again.
    setState('in')
    timers.current.push(window.setTimeout(() => setState('out'), 420))
    timers.current.push(window.setTimeout(() => setState('idle'), 1060))
    return clear
  }, [token])

  if (state === 'idle') return null

  return (
    <div className={`${styles.veil} ${state === 'out' ? styles.veilOut : ''}`} aria-hidden="true">
      <div className={styles.mark}>
        <NekoLogo size={74} animated={false} />
        <span className={styles.word}>
          <span className={styles.neko}>neko</span>
          <span className={styles.art}>art</span>
        </span>
        <span className={styles.sweep} />
      </div>
    </div>
  )
}
