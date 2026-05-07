import { useEffect, useState } from 'react'
import styles from './ScrollProgress.module.css'

const SECTIONS = [
  { id: 'hero',         label: 'Home'        },
  { id: 'about',        label: 'About'       },
  { id: 'learning',     label: 'Program'     },
  { id: 'gallery',      label: 'Gallery'     },
  { id: 'console',      label: 'Console'     },
  { id: 'countdown',    label: 'Dates'       },
  { id: 'testimonials', label: 'Reviews'     },
  { id: 'pricing',      label: 'Pricing'     },
  { id: 'builder',      label: 'Builder'     },
  { id: 'faq',          label: 'FAQ'         },
  { id: 'book',         label: 'Book'        },
]

export default function ScrollProgress() {
  const [progress,       setProgress]       = useState(0)
  const [activeSection,  setActiveSection]  = useState('hero')
  const [visible,        setVisible]        = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docH      = document.documentElement.scrollHeight - window.innerHeight
      const pct       = docH > 0 ? Math.min(scrollTop / docH, 1) : 0
      setProgress(pct)
      setVisible(scrollTop > 120)

      // Detect active section
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id)
        if (el && el.getBoundingClientRect().top <= 200) {
          setActiveSection(SECTIONS[i].id)
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
  }

  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label ?? ''

  return (
    <div className={`${styles.wrap} ${visible ? styles.visible : ''}`} aria-hidden>
      {/* Track background */}
      <div className={styles.track}>
        {/* Fill bar */}
        <div className={styles.fill} style={{ height: `${progress * 100}%` }} />
        {/* Dot markers for each section */}
        {SECTIONS.map((s, i) => {
          const dotPos = i / (SECTIONS.length - 1)
          const isActive = s.id === activeSection
          return (
            <button
              key={s.id}
              className={`${styles.dot} ${isActive ? styles.dotActive : ''}`}
              style={{ top: `${dotPos * 100}%` }}
              onClick={() => scrollToSection(s.id)}
              title={s.label}
            />
          )
        })}
        {/* Traveling neon orb */}
        <div className={styles.orb} style={{ top: `calc(${progress * 100}% - 6px)` }} />
      </div>

      {/* Section label pill */}
      <div className={`${styles.label} ${visible ? styles.labelVisible : ''}`}>
        {activeLabel}
      </div>
    </div>
  )
}
