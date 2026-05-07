import { scrollTo } from '../lib/scroll'
import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/LangContext'
import TextGlitch from './TextGlitch'
import MagneticButton from './MagneticButton'
import FloatingNotes from './FloatingNotes'
import styles from './Hero.module.css'

function useCounter(end: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const tick  = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * end))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [active, end, duration])
  return val
}

function Counter({ end, suffix, label, active }: {
  end: number; suffix: string; label: string; active: boolean
}) {
  const val = useCounter(end, active)
  return (
    <div className={styles.stat}>
      <span className={styles.statNum}>{val}{suffix}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

export default function Hero() {
  const { t } = useLang()
  const [loaded, setLoaded] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const bg1Ref  = useRef<HTMLDivElement>(null)
  const bg2Ref  = useRef<HTMLDivElement>(null)
  const rafRef  = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        if (!heroRef.current) return
        const rect = heroRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 20
        const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 12
        if (bg1Ref.current) bg1Ref.current.style.transform = `translate(${x * 0.3}px,${y * 0.3}px)`
        if (bg2Ref.current) bg2Ref.current.style.transform = `translate(${-x * 0.2}px,${-y * 0.2}px)`
      })
    }
    window.addEventListener('mousemove', handle, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handle)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const counters = [
    { end: 143, suffix: '+',   label: t('hero_stat1_label') },
    { end: 5,   suffix: 'yrs', label: t('hero_stat2_label') },
    { end: 4,   suffix: '',    label: t('hero_stat3_label') },
    { end: 97,  suffix: '%',   label: t('hero_stat4_label') },
  ]

  return (
    <section ref={heroRef} className={styles.hero} id="hero">
      {/* Parallax background blobs */}
      <div ref={bg1Ref} className={styles.bg1} />
      <div ref={bg2Ref} className={styles.bg2} />
      <div className={styles.bg3} />

      {/* Grid overlay */}
      <div className={styles.grid} />

      {/* Floating music notes */}
      <FloatingNotes />

      {/* Floating orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={`container ${styles.content}`}>

        {/* Label */}
        <div className={`${styles.fadeUp} ${loaded ? styles.in : ''}`} style={{ transitionDelay: '0.05s' }}>
          <span className="label">{t('hero_label')}</span>
        </div>

        {/* ══ Headline ══ */}
        <h1
          className={`${styles.headline} ${styles.fadeUp} ${loaded ? styles.in : ''}`}
          style={{ transitionDelay: '0.18s' }}
        >
          <span className={styles.h1Line}>{t('hero_line1')}</span>

          <span className={styles.h1Line}>
            <TextGlitch
              text={t('hero_line2')}
              className={styles.h1Purple}
              interval={3500}
              duration={700}
              intensity={3}
            />
            <svg className={styles.underlineSvg} viewBox="0 0 300 14" fill="none" aria-hidden>
              <path d="M2 10 Q75 3 150 10 Q225 17 298 10" stroke="#9B30FF" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          </span>

          <span className={`${styles.h1Line} ${styles.h1Outline}`}>
            {t('hero_line3')}
          </span>
        </h1>

        {/* Sub */}
        <p
          className={`${styles.sub} ${styles.fadeUp} ${loaded ? styles.in : ''}`}
          style={{ transitionDelay: '0.35s' }}
        >
          {t('hero_sub').split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </p>

        {/* CTAs */}
        <div
          className={`${styles.ctas} ${styles.fadeUp} ${loaded ? styles.in : ''}`}
          style={{ transitionDelay: '0.5s' }}
        >
          <MagneticButton>
            <button className="btn btn-primary" onClick={() => scrollTo('pricing')}>
              {t('hero_cta1')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </MagneticButton>
          <MagneticButton>
            <button className="btn btn-outline" onClick={() => scrollTo('learning')}>
              {t('hero_cta2')}
            </button>
          </MagneticButton>
        </div>

        {/* Stats */}
        <div
          className={`${styles.stats} ${styles.fadeUp} ${loaded ? styles.in : ''} ${loaded ? styles.visible : ''}`}
          style={{ transitionDelay: '0.65s' }}
        >
          {counters.map(c => <Counter key={c.label} {...c} active={loaded} />)}
        </div>
      </div>

      {/* Waveform — reduced from 40 to 24 bars */}
      <div className={styles.waveform}>
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className={styles.waveBar}
            style={{
              height: `${20 + Math.sin(i * 0.55) * 35 + Math.sin(i * 0.21) * 20 + 15}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.9 + Math.sin(i * 0.4) * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className={styles.scrollHint}>
        <div className={styles.scrollMouse}><div className={styles.scrollWheel}/></div>
        <span className={styles.scrollText}>{t('hero_scroll')}</span>
      </div>
    </section>
  )
}
