import { scrollTo } from '../lib/scroll'
import { useState } from 'react'
import NekoLogo from './NekoLogo'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './Footer.module.css'

export default function Footer() {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)
  const { ref: topRef, isVisible: topIn } = useScrollAnimation<HTMLDivElement>()

  const copyEmail = () => {
    navigator.clipboard.writeText('napdjschool@gmail.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const navLinks = [
    { label: t('nav_about'),   id: 'about'    },
    { label: t('nav_program'), id: 'learning' },
    { label: t('nav_gallery'), id: 'gallery'  },
    { label: 'Testimonials',   id: 'testimonials' },
    { label: t('nav_pricing'), id: 'pricing'  },
    { label: 'DJ Builder',     id: 'builder'  },
  ]

  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.topGlow} />
      <div className={styles.bottomGlow} />

      <div className="container">
        {/* Big CTA */}
        <div ref={topRef} className={`${styles.cta} ${topIn ? styles.in : ''}`}>
          <div className={styles.ctaLeft}>
            <h2 className={`section-title ${styles.ctaTitle}`}>
              {t('footer_cta_title1')}<br />
              <span className={styles.ctaAccent}>{t('footer_cta_title2')}</span>
            </h2>
            <p className={styles.ctaSub}>{t('footer_cta_sub')}</p>
          </div>
          <div className={styles.ctaRight}>
            <button
              className="btn btn-primary"
              style={{ fontSize:'13px', padding:'18px 40px' }}
              onClick={() => scrollTo('book')}
            >
              {t('footer_reserve')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className={`btn btn-outline ${styles.emailBtn} ${copied ? styles.copied : ''}`}
              onClick={copyEmail}
            >
              {copied ? '✓ Copied!' : 'napdjschool@gmail.com'}
            </button>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Info grid */}
        <div className={styles.infoGrid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <NekoLogo size={48} animated={false} />
              <div className={styles.logoText}>
                <span className={styles.logoNeko}>neko</span>
                <span className={styles.logoArt}> art</span>
                <span className={styles.logoPlatform}>platform.lt</span>
              </div>
            </div>
            <p className={styles.brandDesc}>{t('footer_desc')}</p>
            <div className={styles.badges}>
              <div className={styles.badge}>
                <span className={styles.badgeNum}>143+</span>
                <span className={styles.badgeLabel}>{t('footer_students')}</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeNum}>4.8★</span>
                <span className={styles.badgeLabel}>{t('footer_rating')}</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeNum}>2020</span>
                <span className={styles.badgeLabel}>{t('footer_founded')}</span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className={styles.linksCol}>
            <div className={styles.colTitle}>{t('footer_nav')}</div>
            {navLinks.map(l => (
              <button key={l.id} className={styles.link} onClick={() => scrollTo(l.id)}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Courses */}
          <div className={styles.linksCol}>
            <div className={styles.colTitle}>{t('footer_courses')}</div>
            <span className={styles.linkStatic}>{t('pricing_basic_name')} (€89)</span>
            <span className={styles.linkStatic}>{t('pricing_pro_name')} (€170)</span>
            <span className={styles.linkStatic}>{t('pricing_elite_name')} (€299)</span>
            <span className={styles.linkStatic}>{t('footer_trial')}</span>
            <div className={styles.colTitle} style={{ marginTop:'24px' }}>{t('footer_follow')}</div>
            <a href="https://instagram.com/napdjschool" className={styles.link} target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://soundcloud.com/napdjschool" className={styles.link} target="_blank" rel="noreferrer">SoundCloud</a>
            <a href="https://facebook.com/napdjschool" className={styles.link} target="_blank" rel="noreferrer">Facebook</a>
          </div>

          {/* Contact */}
          <div className={styles.linksCol}>
            <div className={styles.colTitle}>{t('footer_contact')}</div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>✉</span>
              <a href="mailto:napdjschool@gmail.com" className={styles.contactLink}>napdjschool@gmail.com</a>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📍</span>
              <span className={styles.contactText}>Klaipėda, Lithuania</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>🕐</span>
              <span className={styles.contactText}>Mon–Sat, 10:00–22:00</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>🎓</span>
              <span className={styles.contactText}>Teaching Since 2020</span>
            </div>

            <div className={styles.hoursCard}>
              <div className={styles.hoursTitle}>{t('footer_hours_title')}</div>
              <div className={styles.hoursRow}><span>{t('footer_weekdays')}</span><span>18:00–22:00</span></div>
              <div className={styles.hoursRow}><span>{t('footer_weekends')}</span><span>10:00–18:00</span></div>
              <div className={styles.hoursRow}><span>{t('footer_trial')}</span><span>{t('footer_trial_val')}</span></div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <span>{t('footer_rights')}</span>
          <span className={styles.bottomCenter}>Klaipėda · Lithuania · Est. 2020</span>
          <span className={styles.madeWith}>{t('footer_tagline')}</span>
        </div>
      </div>
    </footer>
  )
}
