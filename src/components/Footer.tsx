import { scrollTo } from '../lib/scroll'
import { useState } from 'react'
import NekoLogo from './NekoLogo'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { CONTACT, LINKS, LEGAL, HOURS_LABEL, socialLinks } from '../config/site'
import { LEGAL_PAGES } from '../legal/pages'
import StudioMap from './StudioMap'
import { navigate } from '../lib/router'
import styles from './Footer.module.css'

export default function Footer() {
  const { t, lang } = useLang()
  const [copied, setCopied] = useState(false)
  const { ref: topRef, isVisible: topIn } = useScrollAnimation<HTMLDivElement>()

  const socials = socialLinks()

  const copyEmail = () => {
    navigator.clipboard.writeText(CONTACT.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const navLinks = [
    { label: t('nav_about'),   id: 'about'    },
    { label: t('nav_program'), id: 'learning' },
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
              {copied ? '✓ Copied!' : CONTACT.email}
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
                <span className={styles.badgeNum}>1-on-1</span>
                <span className={styles.badgeLabel}>{t('footer_students')}</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeNum}>Mon–Fri</span>
                <span className={styles.badgeLabel}>{t('footer_rating')}</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeNum}>2021</span>
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

            {/* Social — only links that are filled in src/config/site.ts */}
            {socials.length > 0 && (
              <>
                <div className={styles.colTitle} style={{ marginTop:'24px' }}>{t('footer_follow')}</div>
                {socials.map(s => (
                  <a key={s.label} href={s.url} className={styles.link} target="_blank" rel="noreferrer">{s.label}</a>
                ))}
              </>
            )}

            <div className={styles.colTitle} style={{ marginTop:'24px' }}>{t('footer_legal')}</div>
            {LEGAL_PAGES.map(p => (
              <a
                key={p.path}
                href={p.path}
                className={styles.link}
                onClick={e => { e.preventDefault(); navigate(p.path) }}
              >
                {p.title[lang]}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div className={styles.linksCol}>
            <div className={styles.colTitle}>{t('footer_contact')}</div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>✉</span>
              <a href={`mailto:${CONTACT.email}`} className={styles.contactLink}>{CONTACT.email}</a>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>☎</span>
              <a href={`tel:${CONTACT.phoneHref}`} className={styles.contactLink}>{CONTACT.phone}</a>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📍</span>
              {LINKS.googleMaps ? (
                <a href={LINKS.googleMaps} className={styles.contactLink} target="_blank" rel="noreferrer">
                  {CONTACT.address ? `${CONTACT.address}, ` : ''}{CONTACT.city}, {CONTACT.country}
                </a>
              ) : (
                <span className={styles.contactText}>
                  {CONTACT.address ? `${CONTACT.address}, ` : ''}{CONTACT.city}, {CONTACT.country}
                </span>
              )}
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>🕐</span>
              <span className={styles.contactText}>{t('footer_weekdays')}, {HOURS_LABEL}</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>🎓</span>
              <span className={styles.contactText}>Neko muzika, VšĮ · since 2021</span>
            </div>

            <StudioMap />

            <div className={styles.hoursCard}>
              <div className={styles.hoursTitle}>{t('footer_hours_title')}</div>
              <div className={styles.hoursRow}><span>{t('footer_weekdays')}</span><span>{HOURS_LABEL}</span></div>
              <div className={styles.hoursRow}><span>{t('footer_weekends')}</span><span>{t('footer_closed')}</span></div>
              <div className={styles.hoursRow}><span>{t('footer_trial')}</span><span>{t('footer_trial_val')}</span></div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <span>
            {t('footer_rights')}
            {LEGAL.companyName && (
              <span className={styles.legalId}>
                {LEGAL.companyName}
                {LEGAL.companyCode ? ` · ${LEGAL.companyCode}` : ''}
              </span>
            )}
          </span>
          <span className={styles.bottomCenter}>Klaipėda · Lithuania · Est. 2021</span>
          <span className={styles.madeWith}>{t('footer_tagline')}</span>
        </div>
      </div>
    </footer>
  )
}
