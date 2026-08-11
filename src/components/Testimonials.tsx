import { useState, useEffect } from 'react'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './Testimonials.module.css'

/* Real reviews, given by the studio. Roles are kept vague on purpose: we know
   what these people said, not what year they graduated, and inventing that
   detail is how the previous placeholder testimonials went wrong. */
const PEOPLE = [
  { name:'Artemij S.', role:'Student, now teaching', initials:'AS', color:'#9B30FF', key:'test_t1' as const },
  { name:'Lana G.',    role:'Student',               initials:'LG', color:'#00C8FF', key:'test_t2' as const },
  { name:'Veronika B.',role:'Student',               initials:'VB', color:'#BF5FFF', key:'test_t3' as const },
  { name:'Danil P.',   role:'Student',               initials:'DP', color:'#39FF14', key:'test_t4' as const },
]

export default function Testimonials() {
  const { t } = useLang()
  const [active, setActive]   = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const { ref: titleRef, isVisible: titleIn } = useScrollAnimation<HTMLDivElement>()
  const { ref: gridRef,  isVisible: gridIn  } = useScrollAnimation<HTMLDivElement>(0.05)

  useEffect(() => {
    if (!autoplay) return
    const timer = setInterval(() => setActive(a => (a + 1) % PEOPLE.length), 4200)
    return () => clearInterval(timer)
  }, [autoplay])

  const current = PEOPLE[active]

  return (
    <section className={`section ${styles.test}`} id="testimonials">
      <div className={styles.bgRight} />
      <div className="container">
        <div ref={titleRef} className={`${styles.header} ${titleIn ? styles.in : ''}`}>
          <span className="label">{t('test_label')}</span>
          <h2 className={`section-title ${styles.title}`}>
            {t('test_title1')} <span className={styles.accent}>{t('test_title2')}</span>
          </h2>
        </div>

        <div ref={gridRef} className={`${styles.layout} ${gridIn ? styles.layoutIn : ''}`}>
          {/* Featured quote */}
          <div className={styles.featured}>
            <div className={styles.featuredInner} key={`${active}-${t('test_label')}`}>
              <div className={styles.quoteIcon}>"</div>
              <p className={styles.featuredText}>{t(current.key)}</p>
              <div className={styles.featuredAuthor}>
                <div
                  className={styles.avatar}
                  style={{ background: `${current.color}25`, borderColor: current.color }}
                >
                  <span style={{ color: current.color }}>{current.initials}</span>
                </div>
                <div>
                  <div className={styles.featuredName}>{current.name}</div>
                  <div className={styles.featuredRole}>{current.role}</div>
                </div>
              </div>
            </div>
            <div className={styles.dots}>
              {PEOPLE.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${active === i ? styles.dotActive : ''}`}
                  onClick={() => { setActive(i); setAutoplay(false) }}
                />
              ))}
            </div>
          </div>

          {/* Side cards */}
          <div className={styles.cards}>
            {PEOPLE.map((person, i) => (
              <div
                key={i}
                className={`${styles.card} ${active === i ? styles.cardActive : ''}`}
                style={{ transitionDelay: `${i * 0.06}s` }}
                onClick={() => { setActive(i); setAutoplay(false) }}
              >
                <div
                  className={styles.cardAvatar}
                  style={{ background: `${person.color}20`, borderColor: `${person.color}50` }}
                >
                  <span style={{ color: person.color }}>{person.initials}</span>
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>{person.name}</div>
                  <div className={styles.cardRole}>{person.role}</div>
                </div>
                {active === i && <div className={styles.cardActiveDot} style={{ background: person.color }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
