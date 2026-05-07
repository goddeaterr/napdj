import { useState, useEffect } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './Gallery.module.css'

const items = [
  { id:1, rot:-2,   label:'Studio A — Pioneer Setup',  sub:'CDJ-2000 NXS2 + DJM-900',    color:'#0d0020', accent:'#9B30FF', h:'55%', desc:'The main studio room with two Pioneer CDJ-2000 NXS2 players and a DJM-900 NXS2 mixer — identical to the setup found in Berghain, fabric, and every major club worldwide.' },
  { id:2, rot:2.5,  label:'Live @ Club Noir',           sub:'Student debut night',         color:'#001020', accent:'#00C8FF', h:'65%', desc:'A student\'s Step 4 debut performance at Club Noir, Klaipėda. Real audience, real energy — exactly what the course builds toward from day one.' },
  { id:3, rot:-1.5, label:'Mixing Workshop',            sub:'Week 2 techniques',           color:'#0d0020', accent:'#9B30FF', h:'45%', desc:'Hands-on EQ, filter and transition workshop during Step 2. Students build their first seamless 30-minute set using proper harmonic mixing.' },
  { id:4, rot:3,    label:'Crowd Reading Session',      sub:'Week 3 masterclass',          color:'#001408', accent:'#39FF14', h:'60%', desc:'Step 3 masterclass on reading the room — tension, release, energy arc. The skill that separates DJs who just play music from those who control a crowd.' },
  { id:5, rot:-2.5, label:'Graduation Night 2024',      sub:'12 new DJs born',             color:'#0d0020', accent:'#BF5FFF', h:'50%', desc:'2024 graduation night. 12 students each played a 15-minute set. Every one walked away with a recorded portfolio piece and a room full of supporters.' },
  { id:6, rot:1.5,  label:'Studio B — Open Practice',  sub:'Between-lesson sessions',     color:'#1a0a00', accent:'#FFB830', h:'55%', desc:'Studio B is available for booked practice between lessons. Same professional gear, unlimited repetition — the real secret behind rapid improvement.' },
]

export default function Gallery() {
  const [hoveredId,  setHoveredId]  = useState<number | null>(null)
  const [lightboxId, setLightboxId] = useState<number | null>(null)
  const { ref: titleRef, isVisible: titleIn } = useScrollAnimation<HTMLDivElement>()

  // Close lightbox on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxId])

  const lightboxItem = items.find(i => i.id === lightboxId)

  return (
    <section className={`section ${styles.gallery}`} id="gallery">
      <div className="container">
        <div ref={titleRef} className={`${styles.header} ${titleIn ? styles.in : ''}`}>
          <span className="label">Inside neko art</span>
          <h2 className={`section-title ${styles.title}`}>
            The <span className={styles.accent}>Studio.</span>
          </h2>
          <p className={styles.sub}>Click to explore</p>
        </div>

        <div className={styles.grid}>
          {items.map((item, i) => (
            <GalleryCard
              key={item.id}
              item={item}
              delay={i * 0.1}
              isHovered={hoveredId === item.id}
              anyHovered={hoveredId !== null}
              onHover={() => setHoveredId(item.id)}
              onLeave={() => setHoveredId(null)}
              onClick={() => setLightboxId(item.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxItem && (
        <div
          className={`${styles.lightboxBackdrop} ${lightboxId ? styles.lightboxOpen : ''}`}
          onClick={() => setLightboxId(null)}
        >
          <div className={styles.lightbox} onClick={e => e.stopPropagation()}>
            {/* Neon corner accents */}
            <span className={styles.lbCornerTL} style={{ borderColor: lightboxItem.accent }} />
            <span className={styles.lbCornerTR} style={{ borderColor: lightboxItem.accent }} />
            <span className={styles.lbCornerBL} style={{ borderColor: lightboxItem.accent }} />
            <span className={styles.lbCornerBR} style={{ borderColor: lightboxItem.accent }} />

            {/* Close button */}
            <button className={styles.lbClose} onClick={() => setLightboxId(null)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Visual panel */}
            <div
              className={styles.lbPhoto}
              style={{ background: `radial-gradient(circle at 40% 35%, ${lightboxItem.accent}35, ${lightboxItem.color})` }}
            >
              <div className={styles.lbBeam} style={{ background: `linear-gradient(160deg,${lightboxItem.accent}20,transparent)` }} />
              <div className={styles.lbEq}>
                {Array.from({ length: 20 }, (_, j) => (
                  <div key={j} className={styles.lbEqBar} style={{
                    height: `${20 + Math.abs(Math.sin(j * 0.8) * 60) + Math.abs(Math.cos(j * 0.3) * 20)}%`,
                    background: lightboxItem.accent,
                    animationDelay: `${j * 0.07}s`,
                    animationDuration: `${0.6 + Math.sin(j * 0.5) * 0.3}s`,
                  }} />
                ))}
              </div>
              <div className={styles.lbGlow} style={{ background: `radial-gradient(circle,${lightboxItem.accent}30,transparent 60%)` }} />
              {/* Item number */}
              <div className={styles.lbNum} style={{ color: lightboxItem.accent }}>0{lightboxItem.id}</div>
            </div>

            {/* Info panel */}
            <div className={styles.lbInfo}>
              <div className={styles.lbTag} style={{ color: lightboxItem.accent }}>
                {lightboxItem.sub}
              </div>
              <h3 className={styles.lbTitle}>{lightboxItem.label}</h3>
              <p className={styles.lbDesc}>{lightboxItem.desc}</p>
              <div className={styles.lbAccentLine} style={{ background: lightboxItem.accent }} />
              <div className={styles.lbNav}>
                <button
                  className={styles.lbNavBtn}
                  onClick={() => setLightboxId(id => {
                    const idx = items.findIndex(i => i.id === id)
                    return items[(idx - 1 + items.length) % items.length].id
                  })}
                >← Prev</button>
                <span className={styles.lbCounter}>
                  {items.findIndex(i => i.id === lightboxId) + 1} / {items.length}
                </span>
                <button
                  className={styles.lbNavBtn}
                  onClick={() => setLightboxId(id => {
                    const idx = items.findIndex(i => i.id === id)
                    return items[(idx + 1) % items.length].id
                  })}
                >Next →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function GalleryCard({ item, delay, isHovered, anyHovered, onHover, onLeave, onClick }: {
  item: typeof items[0]; delay: number
  isHovered: boolean; anyHovered: boolean
  onHover: () => void; onLeave: () => void; onClick: () => void
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(0.08)
  return (
    <div
      ref={ref}
      className={`${styles.item} ${isVisible ? styles.itemIn : ''} ${isHovered ? styles.hovered : ''} ${anyHovered && !isHovered ? styles.dimmed : ''}`}
      style={{ '--rot': `${item.rot}deg`, transitionDelay: `${delay}s` } as React.CSSProperties}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div
        className={styles.photo}
        style={{ background: `radial-gradient(circle at 40% 35%, ${item.accent}28, ${item.color})` }}
      >
        <div className={styles.beam} style={{ background: `linear-gradient(160deg,${item.accent}15,transparent)` }} />
        <div className={styles.eq}>
          {Array.from({ length: 12 }, (_, j) => (
            <div key={j}
              className={`${styles.eqBar} ${isHovered ? styles.eqActive : ''}`}
              style={{
                height: `${18 + Math.sin(j*0.8+item.id)*32 + Math.cos(j*0.3)*18 + 15}%`,
                background: item.accent,
                opacity: isHovered ? 0.7 : 0.3,
                animationDelay: `${j * 0.1}s`,
                animationDuration: `${0.7 + Math.sin(j*0.5) * 0.3}s`,
              }}
            />
          ))}
        </div>
        <div className={styles.centerGlow} style={{ background: `radial-gradient(circle,${item.accent}30,transparent 60%)` }} />
        <div className={styles.overlay} />
        <div className={styles.photoMeta}>
          <div className={styles.photoLabel}>{item.label}</div>
          <div className={styles.photoSub}>{item.sub}</div>
        </div>
        <div className={styles.corner} style={{ borderColor: item.accent }} />
        {/* Click hint */}
        <div className={`${styles.clickHint} ${isHovered ? styles.clickHintVisible : ''}`}>
          <span>Click to expand</span>
        </div>
      </div>
    </div>
  )
}
