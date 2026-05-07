import { scrollTo } from '../lib/scroll'
import { useState } from 'react'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './Pricing.module.css'
import TiltCard from './TiltCard'

export default function Pricing() {
  const { t } = useLang()
  const [hovered, setHovered] = useState<string | null>(null)
  const { ref: titleRef, isVisible: titleIn  } = useScrollAnimation<HTMLDivElement>()
  const { ref: cardsRef, isVisible: cardsIn  } = useScrollAnimation<HTMLDivElement>(0.05)

  const plans = [
    {
      id: 'starter',
      name: t('pricing_basic_name'),
      tagline: t('pricing_basic_tag'),
      price: 89,
      color: 'rgba(0,200,255,1)',
      colorDim: 'rgba(0,200,255,0.12)',
      badge: null,
      desc: t('pricing_basic_desc'),
      includes: [
        '4 individual 1-on-1 lessons',
        'Pioneer CDJ-2000 NXS2 studio',
        'Music theory foundations',
        'Basic beatmatching & mixing',
        'Flexible personal schedule',
      ],
      excludes: ['Live performance', 'Recorded set'],
      cta: t('pricing_cta_basic'),
    },
    {
      id: 'pro',
      name: t('pricing_pro_name'),
      tagline: t('pricing_pro_tag'),
      price: 170,
      color: 'rgba(155,48,255,1)',
      colorDim: 'rgba(155,48,255,0.12)',
      badge: t('pricing_popular'),
      desc: t('pricing_pro_desc'),
      includes: [
        '8 individual 1-on-1 lessons',
        'Pioneer CDJ-2000 NXS2 + DJM-900',
        'Studio access by appointment',
        'Full mixing, EQ & FX curriculum',
        'Crowd psychology & set planning',
        'Live club performance (Step 4)',
        'Professionally recorded set',
        'neko art alumni network',
      ],
      excludes: [],
      cta: t('pricing_cta_pro'),
    },
    {
      id: 'elite',
      name: t('pricing_elite_name'),
      tagline: t('pricing_elite_tag'),
      price: 299,
      color: 'rgba(255,45,120,1)',
      colorDim: 'rgba(255,45,120,0.1)',
      badge: t('pricing_best'),
      desc: t('pricing_elite_desc'),
      includes: [
        'Everything in Pro Course',
        'Double-session intensive format',
        'Custom genre specialisation',
        '3 months post-course mentorship',
        '2 live performance opportunities',
        'Gear & setup consultation',
        'Personal DJ brand guidance',
        'Priority session booking',
      ],
      excludes: [],
      cta: t('pricing_cta_elite'),
    },
  ]

  return (
    <section className={`section ${styles.pricing}`} id="pricing">
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      <div className="container">
        <div ref={titleRef} className={`${styles.header} ${titleIn ? styles.in : ''}`}>
          <span className="label">{t('pricing_label')}</span>
          <h2 className={`section-title ${styles.title}`}>
            {t('pricing_title1')}<br />
            <span className={styles.accent}>{t('pricing_title2')}</span>
          </h2>
          <p className={styles.sub}>{t('pricing_sub')}</p>
        </div>

        <div ref={cardsRef} className={`${styles.plans} ${cardsIn ? styles.plansIn : ''}`}>
          {plans.map((plan, i) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              delay={i * 0.14}
              isHovered={hovered === plan.id}
              otp={t('pricing_otp')}
              onHover={() => setHovered(plan.id)}
              onLeave={() => setHovered(null)}
            />
          ))}
        </div>

        <div className={`${styles.guarantee} ${titleIn ? styles.in : ''}`} style={{ transitionDelay: '0.6s' }}>
          <div className={styles.guaranteeIcon}>✦</div>
          <div>
            <div className={styles.guaranteeTitle}>{t('pricing_guarantee_title')}</div>
            <div className={styles.guaranteeText}>{t('pricing_guarantee_text')}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface PlanData {
  id: string; name: string; tagline: string; price: number
  color: string; colorDim: string; badge: string|null
  desc: string; includes: string[]; excludes: string[]; cta: string
}

function PricingCard({ plan, delay, isHovered, otp, onHover, onLeave }: {
  plan: PlanData
  delay: number; isHovered: boolean; otp: string
  onHover: () => void; onLeave: () => void
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(0.1)
  const isPro = plan.id === 'pro'

  return (
    <TiltCard maxTilt={isPro ? 12 : 8} glareOpacity={isPro ? 0.2 : 0.12} scale={1.02}>
    <div
      ref={ref}
      className={`${styles.card} ${isPro ? styles.cardPro : ''} ${isVisible ? styles.cardIn : ''}`}
      style={{ '--c': plan.color, '--cdim': plan.colorDim, transitionDelay: `${delay}s` } as React.CSSProperties}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {plan.badge && (
        <div className={styles.badge} style={{ background: plan.color }}>{plan.badge}</div>
      )}

      <div className={styles.planTop}>
        <div className={styles.planName} style={{ color: plan.color }}>{plan.name}</div>
        <div className={styles.planTagline}>{plan.tagline}</div>
      </div>

      <div className={styles.priceRow}>
        <span className={styles.currency}>€</span>
        <span className={styles.amount}>{plan.price}</span>
      </div>
      <div className={styles.period}>{otp}</div>

      <p className={styles.desc}>{plan.desc}</p>
      <div className={styles.divider} style={{ background: plan.color, opacity: 0.15 }} />

      <ul className={styles.features}>
        {plan.includes.map((item, i) => (
          <li key={i} className={styles.featureItem}>
            <span className={styles.check} style={{ color: plan.color }}>◆</span>
            {item}
          </li>
        ))}
        {plan.excludes.map((item, i) => (
          <li key={`ex${i}`} className={`${styles.featureItem} ${styles.excluded}`}>
            <span className={styles.ex}>✕</span>{item}
          </li>
        ))}
      </ul>

      <button
        className={`btn ${isPro ? 'btn-primary' : 'btn-outline'} ${styles.cta}`}
        style={isPro ? {} : { borderColor: plan.color, color: plan.color }}
        onClick={() => scrollTo('book')}
      >
        {plan.cta}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
    </TiltCard>
  )
}
