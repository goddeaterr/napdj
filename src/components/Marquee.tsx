import { VENUE } from '../config/site'
import styles from './Marquee.module.css'

interface MarqueeProps {
  items: string[]
  speed?: number
  reverse?: boolean
  accent?: boolean
}

export default function Marquee({ items, speed = 30, reverse = false, accent = false }: MarqueeProps) {
  // Duplicate for seamless loop
  const doubled = [...items, ...items, ...items]

  return (
    <div className={`${styles.wrap} ${accent ? styles.accent : ''}`}>
      <div className={styles.inner}>
        <div
          className={`${styles.track} ${reverse ? styles.reverse : ''}`}
          style={{ animationDuration: `${speed}s` }}
        >
          {doubled.map((item, i) => (
            <span key={i} className={styles.item}>
              <span className={styles.dot}>◆</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Preset marquees
export function GraduatesMarquee() {
  const names = [
    'Lukas B.', 'Gabija P.', 'Mantas J.', 'Rūta K.', 'Dovydas S.', 'Ieva M.',
    'Tomas V.', 'Rasa T.', 'Karolis S.', 'Ineta J.', 'Justinas P.', 'Viktorija A.',
    'Emilis N.', 'Gintarė K.', 'Jonas M.', 'Laura V.',
  ]
  return <Marquee items={names} speed={35} />
}

export function ClubsMarquee() {
  const clubs = [
    VENUE.name, 'Studio 54 LT', 'Bazė', 'Žvejų Rūmai', 'Klaipėda Jazz Club',
    'Memelio Namų Šventė', 'Athos Club', 'Palanga Beach Events',
    'Smeltė Festival', 'Jūros Šventė', 'Open Air Klaipėda',
  ]
  return <Marquee items={clubs} speed={40} reverse accent />
}
