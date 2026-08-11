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
  /* This used to scroll invented student names. It shows what is taught
     instead — true, and more useful to someone deciding. */
  const items = [
    'Beatmatching by ear', 'Harmonic mixing', 'EQ & filters', 'Phrasing',
    'Reading the room', 'Effects chains', 'Track selection', 'Live performance',
    'Pioneer CDJ-2000 NXS2', 'DJM-900 NXS2', 'Techno', 'House',
    'Hip-Hop', 'Drum & Bass', 'Afro House',
  ]
  return <Marquee items={items} speed={35} />
}

export function ClubsMarquee() {
  const clubs = [
    VENUE.name, 'Studio 54 LT', 'Bazė', 'Žvejų Rūmai', 'Klaipėda Jazz Club',
    'Memelio Namų Šventė', 'Athos Club', 'Palanga Beach Events',
    'Smeltė Festival', 'Jūros Šventė', 'Open Air Klaipėda',
  ]
  return <Marquee items={clubs} speed={40} reverse accent />
}
