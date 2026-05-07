import { useState } from 'react'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './Learning.module.css'

export default function Learning() {
  const { t } = useLang()
  const [expanded, setExpanded] = useState<number | null>(null)
  const { ref: titleRef, isVisible: titleIn } = useScrollAnimation<HTMLDivElement>()

  const steps = [
    { num: '01', icon: '◈', color: 'rgba(155,48,255,1)', title: t('step1_title'), desc: t('step1_desc'), deep: t('step1_deep'), tags: ['Beat Matching', 'Music Theory', 'CDJ Intro', 'Ear Training'] },
    { num: '02', icon: '◉', color: 'rgba(0,200,255,1)',  title: t('step2_title'), desc: t('step2_desc'), deep: t('step2_deep'), tags: ['EQ Technique', 'Transitions', 'Loops & Cues', 'Harmonic Mix'] },
    { num: '03', icon: '◎', color: 'rgba(57,255,20,1)',  title: t('step3_title'), desc: t('step3_desc'), deep: t('step3_deep'), tags: ['FX Chain', 'Crowd Reading', 'Layering', 'Identity'] },
    { num: '04', icon: '◍', color: 'rgba(155,48,255,1)', title: t('step4_title'), desc: t('step4_desc'), deep: t('step4_deep'), tags: ['Live Set', 'Stage Presence', 'Real Audience', 'Recorded Set'], highlight: true, badge: t('step4_badge') },
  ]

  return (
    <section className={`section ${styles.learning}`} id="learning">
      <div className={styles.bgGlow} />
      <div className="container">
        <div ref={titleRef} className={`${styles.header} ${titleIn ? styles.in : ''}`}>
          <span className="label">{t('learning_label')}</span>
          <h2 className={`section-title ${styles.title}`}>
            {t('learning_title1')}<br />
            <span className={styles.accent}>{t('learning_title2')}</span>
          </h2>
          <p className={styles.sub}>{t('learning_sub')}</p>
        </div>

        <div className={styles.weeksGrid}>
          {steps.map((step, i) => (
            <StepCard
              key={step.num}
              step={step}
              delay={i * 0.13}
              isOpen={expanded === i}
              onToggle={() => setExpanded(expanded === i ? null : i)}
              expandLabel={t('step_expand')}
              collapseLabel={t('step_collapse')}
              stepLabel={t('learning_progress_label')}
            />
          ))}
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressTrack}>
            {steps.map((step, i) => (
              <div key={i} className={styles.progressStep} style={{ '--c': step.color } as React.CSSProperties}>
                <div className={styles.progressDot} />
                <span>{step.title}</span>
              </div>
            ))}
            <div className={styles.progressFill} />
          </div>
        </div>
      </div>
    </section>
  )
}

function StepCard({ step, delay, isOpen, onToggle, expandLabel, collapseLabel, stepLabel }: {
  step: { num: string; icon: string; color: string; title: string; desc: string; deep: string; tags: string[]; highlight?: boolean; badge?: string }
  delay: number; isOpen: boolean; onToggle: () => void
  expandLabel: string; collapseLabel: string; stepLabel: string
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(0.1)
  return (
    <div
      ref={ref}
      className={`${styles.card} ${step.highlight ? styles.highlight : ''} ${isOpen ? styles.open : ''} ${isVisible ? styles.cardIn : ''}`}
      data-step={step.num}
      style={{ transitionDelay: `${delay}s`, '--card-color': step.color } as React.CSSProperties}
      onClick={onToggle}
    >
      {step.highlight && <div className={styles.highlightGlow} />}
      <div className={styles.cardHeader}>
        <span className={styles.weekTag}>{stepLabel} {step.num}</span>
        <span className={styles.cardIcon} style={{ color: step.color }}>{step.icon}</span>
      </div>
      <h3 className={styles.cardTitle}>{step.title}</h3>
      <p className={styles.cardDesc}>{step.desc}</p>
      <div className={styles.tags}>
        {step.tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
      </div>
      <div className={styles.expandable}>
        <div className={styles.expandContent}>
          <div className={styles.expandLine} style={{ background: step.color }} />
          <p className={styles.expandText}>{step.deep}</p>
          {step.highlight && step.badge && <div className={styles.debutBadge}>{step.badge}</div>}
        </div>
      </div>
      <div className={styles.toggle}>
        <span>{isOpen ? collapseLabel : expandLabel}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
          <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}
