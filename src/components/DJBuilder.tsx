import { scrollTo } from '../lib/scroll'
import { useState } from 'react'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './DJBuilder.module.css'

type Genre = 'Techno' | 'House' | 'Hip-Hop' | 'EDM' | 'Drum & Bass' | 'Afro House' | 'Minimal'
type Mood  = 'Energy' | 'Atmosphere' | 'Party' | 'Dark' | 'Emotional' | 'Experimental'

const genreOptions: { value: Genre; icon: string; bpm: string; desc: string }[] = [
  { value: 'Techno',      icon: '◼', bpm: '130–145 BPM', desc: 'Deep · Driving · Hypnotic' },
  { value: 'House',       icon: '◉', bpm: '120–128 BPM', desc: 'Groovy · Rhythmic · Dance' },
  { value: 'Hip-Hop',     icon: '◈', bpm: '85–100 BPM',  desc: 'Rhythmic · Beat-Driven · Expressive' },
  { value: 'EDM',         icon: '◆', bpm: '128–140 BPM', desc: 'Energetic · Festival · Massive' },
  { value: 'Drum & Bass', icon: '◍', bpm: '170–180 BPM', desc: 'Fast · Aggressive · High-Energy' },
  { value: 'Afro House',  icon: '○', bpm: '122–126 BPM', desc: 'Organic · Rhythmic · Warm' },
  { value: 'Minimal',     icon: '·', bpm: '128–132 BPM', desc: 'Clean · Subtle · Detail-Focused' },
]

const moodOptions: { value: Mood; icon: string }[] = [
  { value: 'Energy',       icon: '⚡' },
  { value: 'Atmosphere',   icon: '🌊' },
  { value: 'Party',        icon: '🔥' },
  { value: 'Dark',         icon: '🌑' },
  { value: 'Emotional',    icon: '💜' },
  { value: 'Experimental', icon: '🔬' },
]

interface Result {
  headline: string
  color: string
  bpm: string
  firstTrack: string
  direction: string
  technique: string
}

const results: Record<string, Result> = {
  'Techno|Energy':       { headline:'Industrial Destroyer',  color:'#9B30FF', bpm:'132 BPM', firstTrack:'Hard & Relentless Dark Techno',    direction:'Master tension and release. Begin at 132 BPM, build pressure through minimal transitions and long loops. Your weapon is repetition.', technique:'Minimal transitions · Long phrase loops · Aggressive bass layering' },
  'Techno|Atmosphere':   { headline:'Hypnotic Architect',    color:'#00C8FF', bpm:'128 BPM', firstTrack:'Dark Ambient Industrial',          direction:'Build worlds, not just sets. Textural layering and slow filter sweeps are your core tools. Patience is your superpower.', technique:'Filter sweeps · Reverb tails · Subtle modulation' },
  'Techno|Party':        { headline:'Peak Hour Commander',   color:'#BF5FFF', bpm:'138 BPM', firstTrack:'Euphoric Hard Techno',             direction:'You live for the moment the room explodes. Step 2 transitions will completely change how you see energy management.', technique:'High energy drops · Crowd anticipation · Euphoric builds' },
  'Techno|Dark':         { headline:'Void Architect',        color:'#6B10CF', bpm:'133 BPM', firstTrack:'Industrial Dark Techno',           direction:'You thrive in darkness. Learn to weaponize silence and space. The drop hits harder when it comes from nothing.', technique:'Industrial textures · Noise layers · Brutal compression' },
  'Techno|Emotional':    { headline:'Melodic Techno Poet',   color:'#FF2D78', bpm:'130 BPM', firstTrack:'Melodic Techno / Afterhours',      direction:'Rare breed. You want people to feel something deep while their feet keep moving. Melodic techno is your home.', technique:'Chord progressions · Emotional buildups · Layered pads' },
  'Techno|Experimental': { headline:'Sound Alchemist',       color:'#39FF14', bpm:'Various', firstTrack:'Industrial / EBM / Experimental',  direction:'You push boundaries others won\'t touch. Learn the rules first — then break every single one intentionally.', technique:'Unconventional BPM · Sound design · Genre blending' },

  'House|Energy':        { headline:'Groove Engineer',       color:'#39FF14', bpm:'126 BPM', firstTrack:'Driving Deep House',              direction:'Groove is everything. Learn the bassline\'s relationship to the kick first. Start with raw, driving Chicago house at 124 BPM.', technique:'Soulful builds · Vocal stabs · Organic groove flow' },
  'House|Atmosphere':    { headline:'Deep Space Traveler',   color:'#00C8FF', bpm:'122 BPM', firstTrack:'Warm Deep / Organic House',       direction:'Your sets take people on journeys. Embrace silence and space between sounds. Begin with warm, jazzy deep house cuts.', technique:'Organic chords · Jazz samples · Slow 32-bar builds' },
  'House|Party':         { headline:'Dancefloor Alchemist',  color:'#FFB830', bpm:'128 BPM', firstTrack:'Funky Afro / Disco House',        direction:'You mix vibes and pure crowd chemistry. Start with classic disco edits and work toward modern peak-hour anthems.', technique:'Disco edits · Crowd-moving hooks · Classic crossfades' },
  'House|Dark':          { headline:'Dark Room Curator',     color:'#9B30FF', bpm:'124 BPM', firstTrack:'Dark / Stripped Deep House',      direction:'Underground and proud of it. You hate clichés. Learn stripped-back deep house — every element has to earn its place.', technique:'Stripped arrangements · Lo-fi textures · Minimal chords' },
  'House|Emotional':     { headline:'Soul Carrier',          color:'#FF2D78', bpm:'120 BPM', firstTrack:'Soulful / Gospel-Influenced House', direction:'Music as ministry. Gospel house and soul house is your lane. Learn to curate tracks that carry stories, not just beats.', technique:'Vocal-led sets · Gospel chords · Emotional arc building' },
  'House|Experimental':  { headline:'Genre Bender',          color:'#BF5FFF', bpm:'Various', firstTrack:'Broken Beat / Nu-Jazz House',     direction:'You exist between genres. Broken beat, nu-jazz, leftfield house. Learn harmonic theory deeply — you\'ll need it.', technique:'Poly-rhythmic mixing · Jazz theory · Unconventional selections' },

  'Hip-Hop|Energy':      { headline:'Trap Commander',        color:'#FF2D78', bpm:'90 BPM',  firstTrack:'Hard Trap / 808s',               direction:'Control crowds with precise beat switches. Perfect your chopping technique in step 1. Sharp, aggressive, and precise.', technique:'Rapid cuts · Acapella drops · Hype transitions' },
  'Hip-Hop|Atmosphere':  { headline:'Boom Bap Philosopher',  color:'#9B30FF', bpm:'88 BPM',  firstTrack:'Golden Era Boom Bap',            direction:'Your sets are cultural statements. Dig into the 90s catalogue first. Learn to let samples breathe and tell stories.', technique:'Sample flips · Lo-fi texture · Head-nod groove' },
  'Hip-Hop|Party':       { headline:'Club Anthem Curator',   color:'#39FF14', bpm:'95 BPM',  firstTrack:'Party Hip-Hop / R&B',            direction:'You turn rooms into house parties. Nail blend theory in step 2. Focus on sing-alongs and crowd participation moments.', technique:'Sing-alongs · Crowd participation · Big energy drops' },
  'Hip-Hop|Dark':        { headline:'Street Poet',           color:'#6B10CF', bpm:'85 BPM',  firstTrack:'Dark / Underground Hip-Hop',     direction:'Underground rap, abstract beats. You value substance over hype. Learn to read rooms that think differently.', technique:'Abstract selections · Underground catalog · Slow blends' },
  'Hip-Hop|Emotional':   { headline:'Conscious Storyteller', color:'#00C8FF', bpm:'87 BPM',  firstTrack:'Conscious Hip-Hop / Neo-Soul',   direction:'Music as message. Neo-soul, conscious rap, jazz-rap hybrids. The most emotionally intelligent DJ style there is.', technique:'Lyrical focus · Neo-soul bridges · Conscious catalog' },
  'Hip-Hop|Experimental':{ headline:'Beat Scientist',        color:'#FFB830', bpm:'Various', firstTrack:'Experimental / Abstract Hip-Hop', direction:'Madlib, Flying Lotus territory. You make people think. Study sample-based music theory — it will change how you hear.', technique:'Abstract beat selection · Sample archaeology · Tempo shifts' },

  'EDM|Energy':          { headline:'Festival Igniter',      color:'#FF2D78', bpm:'135 BPM', firstTrack:'Big Room / Progressive House',   direction:'You play to tens of thousands. Start by mastering the 4-bar phrase build — every massive festival moment lives there.', technique:'Big room drops · Crowd psychology · Energy arc' },
  'EDM|Atmosphere':      { headline:'Progressive Dreamer',   color:'#00C8FF', bpm:'130 BPM', firstTrack:'Progressive House / Trance',     direction:'You want the journey, not just the drop. Progressive building is an art. Learn to create 10-minute tension arcs.', technique:'Progressive builds · Breakdown depth · Melodic layering' },
  'EDM|Party':           { headline:'Drop Architect',        color:'#9B30FF', bpm:'138 BPM', firstTrack:'Future House / Electro House',   direction:'Every track you play has a moment. You engineer those moments for maximum collective release. Pure crowd science.', technique:'Drop timing · Crowd reading · Build-release mastery' },
  'EDM|Dark':            { headline:'Darker Frequencies',    color:'#6B10CF', bpm:'140 BPM', firstTrack:'Dark Progressive / Psy Trance',  direction:'The underground side of electronic music. Psychedelic and dark progressive. Learn to sustain long-form tension.', technique:'Hypnotic progressions · Dark synthesis · Long arcs' },
  'EDM|Emotional':       { headline:'Uplift Architect',      color:'#FFB830', bpm:'130 BPM', firstTrack:'Melodic Progressive / Uplifting', direction:'You want people to feel genuinely moved. Trance roots, emotional basslines. The most powerful drug in music.', technique:'Emotional buildups · Melodic leads · Euphoric breaks' },
  'EDM|Experimental':    { headline:'Genre Explorer',        color:'#39FF14', bpm:'Various', firstTrack:'Hybrid / Electronic Fusion',     direction:'You don\'t fit in any one genre — and that\'s your power. Cross-genre blending is advanced. Master one lane first.', technique:'Genre fusion · Harmonic matching · BPM transitions' },

  'Drum & Bass|Energy':      { headline:'Neurofunk Surgeon',  color:'#FF2D78', bpm:'174 BPM', firstTrack:'Dark Neurofunk / Technical DnB', direction:'The most technically demanding style. Start with liquid DnB transitions to master rapid timing, then go darker.', technique:'Double drops · Bass modulation · Precise cue points' },
  'Drum & Bass|Atmosphere':  { headline:'Liquid Architect',   color:'#00C8FF', bpm:'170 BPM', firstTrack:'Liquid Drum & Bass',             direction:'Emotional, uplifting, and incredibly demanding. Start with liquid sets and let the energy flow organically between tracks.', technique:'Smooth blends · Melodic drops · Careful track selection' },
  'Drum & Bass|Party':       { headline:'Jump-Up Instigator', color:'#9B30FF', bpm:'175 BPM', firstTrack:'Jump-Up DnB / Jungle Classics',  direction:'The hardest crowd to control and the most rewarding when you do. Begin with classic jungle — teaches every DnB skill.', technique:'Crowd hype · Wobbly basslines · Amen breaks' },
  'Drum & Bass|Dark':        { headline:'Darkstep Engineer',  color:'#6B10CF', bpm:'173 BPM', firstTrack:'Dark / Techstep DnB',            direction:'Technical and uncompromising. Darkstep and techstep DnB. Master the drop precision — every millisecond matters here.', technique:'Technical precision · Dark synthesis · Minimal space' },
  'Drum & Bass|Emotional':   { headline:'Soulful Rollers DJ', color:'#FFB830', bpm:'170 BPM', firstTrack:'Soulful / Roller DnB',           direction:'Rollers and soulful DnB. You want the groove to feel like a warm blanket at 170 BPM. Rare and beautiful.', technique:'Soulful selections · Roller grooves · Long-form blends' },
  'Drum & Bass|Experimental':{ headline:'Bass Music Scientist',color:'#39FF14', bpm:'Various', firstTrack:'Hybrid / Experimental DnB',     direction:'Halftime, ambient DnB, footwork hybrids. You challenge what DnB even means. Study rhythm theory deeply.', technique:'Halftime exploration · Footwork rhythms · Rhythm experiments' },

  'Afro House|Energy':      { headline:'Tribal Force',        color:'#FFB830', bpm:'124 BPM', firstTrack:'Afro House / Tribal Percussions', direction:'Percussion is your language. Learn to read a room through rhythm. Start with classic afro house — feel the polyrhythm.', technique:'Percussion layering · Tribal energy · Rhythmic builds' },
  'Afro House|Atmosphere':  { headline:'Savanna Dreamer',     color:'#00C8FF', bpm:'120 BPM', firstTrack:'Organic / Ambient Afro House',   direction:'Organic instruments, natural textures, warm basslines. You create spaces that feel ancient and futuristic simultaneously.', technique:'Organic textures · Natural sounds · Warm bass progression' },
  'Afro House|Party':       { headline:'Ubuntu Groove Master', color:'#39FF14', bpm:'126 BPM', firstTrack:'Funky Afro / Afro Tech',        direction:'The most joyful genre in electronic music. Ubuntu energy — everyone belongs on this dancefloor. Start with Enoo Napa.', technique:'Communal energy · Call and response · Joyful selections' },
  'Afro House|Dark':        { headline:'Ancestral Caller',    color:'#9B30FF', bpm:'122 BPM', firstTrack:'Dark Afro / Ritual House',       direction:'Deep, ritual, almost spiritual. Dark afro house has depth few genres match. Let the percussion tell the story.', technique:'Ritual textures · Deep percussion · Spiritual arc' },
  'Afro House|Emotional':   { headline:'Heart Drummer',       color:'#FF2D78', bpm:'120 BPM', firstTrack:'Soulful Afro / Deep Afro House', direction:'Where rhythm meets soul. Your sets carry cultural memory and emotional depth. Learn the history behind every track.', technique:'Emotional percussion · Cultural depth · Soulful selections' },
  'Afro House|Experimental':{ headline:'Rhythm Scientist',    color:'#BF5FFF', bpm:'Various', firstTrack:'Experimental Afro / Global Bass', direction:'Global bass, polyrhythm experiments, genre fusion from the African diaspora. Deeply study rhythm theory from the source.', technique:'Polyrhythm theory · Global influences · Rhythm experimentation' },

  'Minimal|Energy':      { headline:'Micro Tension Master',  color:'#BF5FFF', bpm:'130 BPM', firstTrack:'Minimal Techno / Detroit Minimal', direction:'Less is more — but every single element must earn its place. Master the hi-hat. Then the kick. Then everything else.', technique:'Micro-arrangements · Percussive precision · Negative space' },
  'Minimal|Atmosphere':  { headline:'Silence Sculptor',      color:'#00C8FF', bpm:'128 BPM', firstTrack:'Minimal / Micro House',           direction:'The most meditative style. You understand that silence is a sound. Learn to stretch a groove across an entire hour.', technique:'Space and silence · Long-form grooves · Subtle movement' },
  'Minimal|Party':       { headline:'Subtle Hypnotist',      color:'#39FF14', bpm:'132 BPM', firstTrack:'Minimal Tech House',              direction:'People don\'t realize they\'re dancing until they can\'t stop. Hypnotic minimal is the most sophisticated party tool.', technique:'Hypnotic repetition · Gradual evolution · Rhythmic tension' },
  'Minimal|Dark':        { headline:'Void Walker',           color:'#6B10CF', bpm:'129 BPM', firstTrack:'Dark Minimal / Deepest Dub',     direction:'Dub techno, empty spaces, profound darkness. Ricardo Villalobos territory. This takes years to master — start today.', technique:'Dub echoes · Extreme minimalism · Profound patience' },
  'Minimal|Emotional':   { headline:'Micro Poet',            color:'#FF2D78', bpm:'126 BPM', firstTrack:'Emotional Minimal / Organic',    direction:'Emotional minimal is a contradiction that works. One piano note over 8 bars. Learn to make people feel with almost nothing.', technique:'Single-note impact · Emotional restraint · Space between sounds' },
  'Minimal|Experimental':{ headline:'Process Artist',        color:'#FFB830', bpm:'Various', firstTrack:'Experimental / Concept Minimal', direction:'Music as process, not product. Alva Noto, Ryoji Ikeda territory. Study sound design and acoustic theory before DJing.', technique:'Process-based music · Academic sound design · Conceptual sets' },
}

export default function DJBuilder() {
  const { t } = useLang()
  const [genre, setGenre] = useState<Genre | null>(null)
  const [mood, setMood]   = useState<Mood | null>(null)
  const [revealed, setRevealed] = useState(false)
  const { ref: titleRef, isVisible: titleIn } = useScrollAnimation<HTMLDivElement>()

  const result = genre && mood ? results[`${genre}|${mood}`] : null
  const reset = () => { setGenre(null); setMood(null); setRevealed(false) }

  return (
    <section className={`section ${styles.builder}`} id="builder">
      <div className="container">
        <div ref={titleRef} className={`${styles.header} ${titleIn ? styles.in : ''}`}>
          <span className="label">{t('builder_label')}</span>
          <h2 className={`section-title ${styles.title}`}>
            {t('builder_title1')}<br />
            <span className={styles.accent}>{t('builder_title2')}</span>
          </h2>
          <p className={styles.sub}>{t('builder_sub')}</p>
        </div>

        <div className={styles.interface}>
          {!revealed ? (
            <div className={styles.selectors}>
              {/* Genre */}
              <div className={styles.group}>
                <div className={styles.groupLabel}>
                  <span className={styles.stepNum}>01</span>
                  <span>{t('builder_step1')}</span>
                </div>
                <div className={styles.genreGrid}>
                  {genreOptions.map(g => (
                    <button
                      key={g.value}
                      className={`${styles.genreOpt} ${genre === g.value ? styles.genreActive : ''}`}
                      onClick={() => setGenre(g.value)}
                    >
                      <span className={styles.optIcon}>{g.icon}</span>
                      <span className={styles.optName}>{g.value}</span>
                      <span className={styles.optBpm}>{g.bpm}</span>
                      <span className={styles.optDesc}>{g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div className={styles.group}>
                <div className={styles.groupLabel}>
                  <span className={styles.stepNum}>02</span>
                  <span>{t('builder_step2')}</span>
                </div>
                <div className={styles.moodGrid}>
                  {moodOptions.map(m => (
                    <button
                      key={m.value}
                      className={`${styles.moodOpt} ${mood === m.value ? styles.moodActive : ''}`}
                      onClick={() => setMood(m.value)}
                    >
                      <span className={styles.moodIcon}>{m.icon}</span>
                      <span>{m.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={`btn btn-primary ${styles.reveal} ${!genre || !mood ? styles.revealDisabled : ''}`}
                disabled={!genre || !mood}
                onClick={() => { if (genre && mood) setRevealed(true) }}
              >
                {t('builder_reveal')}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L14 8L8 14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

          ) : result ? (
            <div className={styles.result} style={{ '--rc': result.color } as React.CSSProperties}>
              <div className={styles.resultBg} />
              <div className={styles.resultGlow} style={{ background: `radial-gradient(circle, ${result.color}25, transparent 65%)` }} />

              <div className={styles.resultHeader}>
                <div className={styles.resultBadge}>{genre} · {mood}</div>
                <div className={styles.resultBpm}>{result.bpm}</div>
              </div>

              <h3 className={styles.resultTitle} style={{ color: result.color }}>{result.headline}</h3>
              <div className={styles.resultTrack}>{result.firstTrack}</div>

              <div className={styles.resultCards}>
                <div className={styles.resultCard}>
                  <div className={styles.rcLabel} style={{ color: result.color }}>{t('builder_tech')}</div>
                  <div className={styles.rcText}>{result.technique}</div>
                </div>
                <div className={styles.resultCard}>
                  <div className={styles.rcLabel} style={{ color: result.color }}>{t('builder_begin')}</div>
                  <div className={styles.rcText}>{result.direction}</div>
                </div>
              </div>

              <div className={styles.resultActions}>
                <button className="btn btn-primary"
                  onClick={() => scrollTo('book')}>
                  {t('builder_start')}
                </button>
                <button className="btn btn-outline" onClick={reset}>{t('builder_restart')}</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
