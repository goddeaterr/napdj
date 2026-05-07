import styles from './NekoLogo.module.css'

export default function NekoLogo({ size = 120, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <svg
      className={`${styles.logo} ${animated ? styles.animated : ''}`}
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 48 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="nk-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="nk-glow-soft">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="nk-face" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#140024"/>
          <stop offset="100%" stopColor="#07000f"/>
        </radialGradient>
      </defs>

      {/* ── Left ear ── */}
      <polygon
        className={styles.ear}
        points="9,31 17,7 25,29"
        fill="#9B30FF"
        opacity="0.9"
        filter="url(#nk-glow)"
      />
      {/* ear inner highlight */}
      <polygon points="12,29 18,13 23,28" fill="#BF5FFF" opacity="0.25"/>

      {/* ── Right ear ── */}
      <polygon
        className={styles.ear}
        points="23,29 31,7 39,31"
        fill="#9B30FF"
        opacity="0.9"
        filter="url(#nk-glow)"
      />
      <polygon points="25,28 30,13 36,29" fill="#BF5FFF" opacity="0.25"/>

      {/* ── Head circle ── */}
      <circle
        cx="24" cy="36" r="16"
        fill="url(#nk-face)"
        stroke="#9B30FF"
        strokeWidth="1.4"
        opacity="0.95"
        filter="url(#nk-glow-soft)"
        className={styles.ring}
      />

      {/* ── EQ bars (5) — the DJ mark ── */}
      {/* bar heights: 8, 12, 16, 12, 8  (centered at x=24) */}
      <rect className={`${styles.bar} ${styles.bar1}`} x="13" y="34" width="2.2" height="8"  rx="1.1" fill="#9B30FF" opacity="0.65"/>
      <rect className={`${styles.bar} ${styles.bar2}`} x="18" y="30" width="2.2" height="12" rx="1.1" fill="#9B30FF" opacity="0.82"/>
      <rect className={`${styles.bar} ${styles.bar3}`} x="23" y="26" width="2.2" height="16" rx="1.1" fill="#BF5FFF"/>
      <rect className={`${styles.bar} ${styles.bar4}`} x="28" y="30" width="2.2" height="12" rx="1.1" fill="#9B30FF" opacity="0.82"/>
      <rect className={`${styles.bar} ${styles.bar5}`} x="33" y="34" width="2.2" height="8"  rx="1.1" fill="#9B30FF" opacity="0.65"/>

      {/* ── Subtle shine dot on circle ── */}
      <circle cx="18" cy="27" r="1.5" fill="white" opacity="0.12"/>
    </svg>
  )
}
