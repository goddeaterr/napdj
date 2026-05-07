import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useCountUp } from '../hooks/useCountUp'
import styles from './About.module.css'

export default function About() {
  const { t } = useLang()
  const { ref: leftRef, isVisible: leftIn } = useScrollAnimation<HTMLDivElement>()
  const { ref: rightRef, isVisible: rightIn } = useScrollAnimation<HTMLDivElement>(0.1)
  const { ref: timeRef, isVisible: timeIn } = useScrollAnimation<HTMLDivElement>(0.1)

  // Count-up animations for the stat pills — start once the right panel scrolls in
  const count143 = useCountUp(143, rightIn, 1800)
  const count48  = useCountUp(4.8, rightIn, 1200, 1)
  const count4   = useCountUp(4,   rightIn,  900)

  const features = [
    { icon: '◈', title: t('about_f1_title'), text: t('about_f1_text') },
    { icon: '◉', title: t('about_f2_title'), text: t('about_f2_text') },
    { icon: '◎', title: t('about_f3_title'), text: t('about_f3_text') },
    { icon: '✦', title: t('about_f4_title'), text: t('about_f4_text') },
  ]

  const timeline = [
    { year: '2020', event: t('about_tl1') },
    { year: '2021', event: t('about_tl2') },
    { year: '2022', event: t('about_tl3') },
    { year: '2024', event: t('about_tl4') },
  ]

  return (
    <section className={`section ${styles.about}`} id="about">
      <div className={styles.bgAccent} />
      <div className="container">
        <div className={styles.grid}>
          <div ref={leftRef} className={`${styles.left} ${leftIn ? styles.in : ''}`}>
            <span className="label">{t('about_label')}</span>
            <h2 className={`section-title ${styles.title}`}>
              {t('about_title1')}<br />
              <span className={styles.accent}>{t('about_title2')}</span>
            </h2>
            <p className={styles.body}>{t('about_body1')}</p>
            <p className={styles.body}>{t('about_body2')}</p>
            <div className={styles.features}>
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`${styles.featureCard} ${leftIn ? styles.featureIn : ''}`}
                  style={{ transitionDelay: `${0.2 + i * 0.1}s` }}
                >
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <div>
                    <div className={styles.featureTitle}>{f.title}</div>
                    <div className={styles.featureText}>{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div ref={rightRef} className={`${styles.right} ${rightIn ? styles.in : ''}`}>
            <div className={styles.vinylWrap}>
              <div className={styles.vinyl}>
                <div className={styles.vinylGrooves} />
                <div className={styles.vinylLabel}>
                  <span className={styles.vinylText}>neko</span>
                  <span className={styles.vinylArt}>art</span>
                  <span className={styles.vinylSub}>KLAIPĖDA</span>
                  <div className={styles.vinylHole} />
                </div>
                <div className={styles.vinylReflect} />
              </div>
              <div className={styles.tonearm} />
              {/* Realistic numbers */}
              <div className={`${styles.pill} ${styles.pill1}`}>
                <span className={styles.pillNum}>{count143}+</span>
                <span className={styles.pillLabel}>{t('about_pill1')}</span>
              </div>
              <div className={`${styles.pill} ${styles.pill2}`}>
                <span className={styles.pillNum}>{count48}★</span>
                <span className={styles.pillLabel}>{t('about_pill2')}</span>
              </div>
              <div className={`${styles.pill} ${styles.pill3}`}>
                <span className={styles.pillNum}>{count4} steps</span>
                <span className={styles.pillLabel}>{t('about_pill3')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div ref={timeRef} className={`${styles.timeline} ${timeIn ? styles.timeIn : ''}`}>
          <div className={styles.timelineLabel}><span className="label">{t('about_tl_label')}</span></div>
          <div className={styles.timelineTrack}>
            <div className={styles.timelineLine} />
            {timeline.map((item, i) => (
              <div key={item.year} className={styles.timelineItem} style={{ transitionDelay: `${i * 0.15}s` }}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineYear}>{item.year}</div>
                <div className={styles.timelineEvent}>{item.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
