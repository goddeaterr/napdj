import { useState } from 'react'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './FAQ.module.css'

export default function FAQ() {
  const { t } = useLang()
  const [open, setOpen] = useState<number | null>(0)
  const { ref: titleRef, isVisible: titleIn } = useScrollAnimation<HTMLDivElement>()
  const { ref: listRef,  isVisible: listIn  } = useScrollAnimation<HTMLDivElement>(0.05)

  const faqs = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
    { q: t('faq_q6'), a: t('faq_a6') },
    { q: t('faq_q7'), a: t('faq_a7') },
    { q: t('faq_q8'), a: t('faq_a8') },
  ]

  return (
    <section className={`section ${styles.faq}`} id="faq">
      <div className={styles.bgGlow} />
      <div className="container">
        <div className={styles.layout}>
          {/* Left — sticky header */}
          <div ref={titleRef} className={`${styles.left} ${titleIn ? styles.in : ''}`}>
            <span className="label">{t('faq_label')}</span>
            <h2 className={`section-title ${styles.title}`}>
              {t('faq_title1')}<br />
              <span className={styles.accent}>{t('faq_title2')}</span>
            </h2>
            <p className={styles.sub}>{t('faq_sub')}</p>
            <div className={styles.contactNudge}>
              <span>{t('faq_nudge')}</span>
              <a href="mailto:napdjschool@gmail.com" className={styles.contactLink}>
                napdjschool@gmail.com
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Right — accordion */}
          <div ref={listRef} className={`${styles.list} ${listIn ? styles.in : ''}`}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`${styles.item} ${open === i ? styles.itemOpen : ''}`}
                style={{ transitionDelay: `${i * 0.04}s` }}
              >
                <button className={styles.question} onClick={() => setOpen(open === i ? null : i)}>
                  <span className={styles.qNum}>0{i + 1}</span>
                  <span className={styles.qText}>{faq.q}</span>
                  <span className={styles.qIcon}>
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      style={{ transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.35s' }}
                    >
                      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>
                <div className={styles.answer}>
                  <div className={styles.answerInner}>
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
