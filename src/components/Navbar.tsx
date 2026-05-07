import { useState, useEffect } from 'react'
import { useLang } from '../lib/LangContext'
import type { Lang } from '../lib/i18n'
import type { AudioCtxRef } from '../lib/audio'
import AmbientPlayer from './AmbientPlayer'
import NekoLogo from './NekoLogo'
import styles from './Navbar.module.css'

const SECTION_IDS = ['hero','about','learning','gallery','console','testimonials','pricing','builder','faq','book','contact'] as const

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 72
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function Navbar({ audioCtx }: { audioCtx: AudioCtxRef }) {
  const { lang, setLang, t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive]     = useState('')

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTION_IDS[i])
        if (el && el.getBoundingClientRect().top <= 140) {
          setActive(SECTION_IDS[i]); break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 960) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const links = [
    { label: t('nav_about'),   id: 'about'    },
    { label: t('nav_program'), id: 'learning' },
    { label: t('nav_gallery'), id: 'gallery'  },
    { label: t('nav_pricing'), id: 'pricing'  },
    { label: t('nav_contact'), id: 'contact'  },
  ]

  const go = (id: string) => { scrollToSection(id); setMenuOpen(false) }

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>

        {/* Logo */}
        <button className={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <NekoLogo size={30} animated={false} />
          <div className={styles.logoText}>
            <span className={styles.logoNeko}>neko</span>
            <span className={styles.logoArt}> art</span>
            <span className={styles.logoPlatform}> · platform.lt</span>
          </div>
        </button>

        {/* Desktop nav links */}
        <div className={styles.links}>
          {links.map(l => (
            <button
              key={l.id}
              className={`${styles.link} ${active === l.id ? styles.linkActive : ''}`}
              onClick={() => go(l.id)}
            >
              {l.label}
              <span className={styles.linkLine} />
            </button>
          ))}
        </div>

        {/* Ambient player (desktop only, collapsible) */}
        <div className={styles.ambientWrap}>
          <AmbientPlayer audioCtx={audioCtx} />
        </div>

        {/* Language switcher (desktop only) */}
        <div className={styles.langSwitch}>
          {(['en','ru','lt'] as Lang[]).map((l, i) => (
            <button
              key={l}
              className={`${styles.langBtn} ${lang === l ? styles.langActive : ''}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
              {i < 2 && <span className={styles.langSep}>/</span>}
            </button>
          ))}
        </div>

        {/* Book CTA */}
        <button
          className={`btn btn-primary ${styles.navCta}`}
          onClick={() => go('book')}
        >
          {t('nav_book')}
        </button>

        {/* Hamburger */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`${styles.mobile} ${menuOpen ? styles.mobileOpen : ''}`} aria-hidden={!menuOpen}>
        <div className={styles.mobileInner}>
          {/* Logo row */}
          <div className={styles.mobileLogo}>
            <NekoLogo size={28} animated={false} />
            <span className={styles.mobileLogoText}>
              <span className={styles.logoNeko}>neko</span>
              <span className={styles.logoArt}> art</span>
            </span>
          </div>

          {/* Nav links */}
          <div className={styles.mobileLinks}>
            {links.map(l => (
              <button key={l.id} className={styles.mobileLink} onClick={() => go(l.id)}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Ambient + Book */}
          <AmbientPlayer audioCtx={audioCtx} compact />

          {/* Bottom row: Lang + Book */}
          <div className={styles.mobileBottom}>
            <div className={styles.mobileLang}>
              {(['en','ru','lt'] as Lang[]).map(l => (
                <button
                  key={l}
                  className={`${styles.mobileLangBtn} ${lang === l ? styles.mobileLangActive : ''}`}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary"
              style={{ marginLeft: 'auto', padding: '11px 20px', fontSize: '11px' }}
              onClick={() => go('book')}
            >
              {t('nav_book')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
