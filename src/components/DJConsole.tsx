import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { scrollTo } from '../lib/scroll'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { getAudioContext, ALL_BANKS } from '../lib/audio'
import type { AudioCtxRef } from '../lib/audio'
import styles from './DJConsole.module.css'

export default function DJConsole({ audioCtx }: { audioCtx: AudioCtxRef }) {
  const { t } = useLang()
  const { ref: secRef, isVisible } = useScrollAnimation<HTMLDivElement>(0.05)

  const [bankIdx,   setBankIdx]   = useState(2)
  const [activePad, setActivePad] = useState<number | null>(null)
  const [bpm,       setBpm]       = useState(128)
  const [isPlaying, setIsPlaying] = useState(false)
  const [step,      setStep]      = useState(-1)
  const [seq,       setSeq]       = useState<boolean[]>(Array(16).fill(false))
  const [eqBars,    setEqBars]    = useState<number[]>(Array(16).fill(0))
  const [glitch,    setGlitch]    = useState(false)
  const [random,    setRandom]    = useState(false)
  const [arp,       setArp]       = useState(false)
  const [tapTimes,  setTapTimes]  = useState<number[]>([])

  const masterGain  = useRef<GainNode | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef     = useRef(0)
  const bank        = ALL_BANKS[bankIdx]

  /* ── Audio chain ── */
  const getChain = useCallback((): AudioNode => {
    const ctx = getAudioContext(audioCtx)
    if (!masterGain.current) {
      masterGain.current = ctx.createGain()
      masterGain.current.gain.value = 0.75
      masterGain.current.connect(ctx.destination)
    }
    return masterGain.current
  }, [audioCtx])

  /* ── Hit pad ── */
  const hitPad = useCallback((i: number, vel = 1) => {
    const ctx  = getAudioContext(audioCtx)
    const dest = getChain()
    const pad  = glitch && Math.random() > 0.6
      ? bank.pads[Math.floor(Math.random() * bank.pads.length)]
      : bank.pads[i]
    const v = random ? Math.random() * 0.45 + 0.55 : 1

    pad.synth(ctx, dest, vel * v)

    if (arp) {
      [0.12, 0.24, 0.38].forEach((dt, ai) => {
        const ai2 = (i + [2, 4, 7][ai]) % bank.pads.length
        setTimeout(() => bank.pads[ai2].synth(ctx, dest, vel * 0.55 * v), dt * 1000)
      })
    }

    setActivePad(i)
    setTimeout(() => setActivePad(p => p === i ? null : p), 160)

    setEqBars(bars => {
      const next = [...bars]
      const pos  = Math.floor(Math.random() * next.length)
      next[pos]  = 0.4 + Math.random() * 0.6
      return next.map((b, bi) => bi === pos ? b : Math.max(0, b - 0.06))
    })
  }, [audioCtx, bank, getChain, glitch, random, arp])

  /* ── EQ decay ── */
  useEffect(() => {
    const id = setInterval(() => setEqBars(b => b.map(v => Math.max(0, v - 0.04))), 60)
    return () => clearInterval(id)
  }, [])

  /* ── Sequencer ── */
  useEffect(() => {
    if (isPlaying) {
      const ms = (60 / bpm / 4) * 1000
      stepRef.current = 0
      intervalRef.current = setInterval(() => {
        const s = stepRef.current % 16
        setStep(s)
        if (seq[s])             hitPad(0, 1)
        if ([4, 12].includes(s)) hitPad(1, 0.75)
        if (s % 2 === 0)        hitPad(2, 0.45)
        stepRef.current++
      }, ms)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setStep(-1)
      stepRef.current = 0
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, bpm, seq, hitPad])

  /* ── Keyboard shortcuts Q W E R / A S D F ── */
  useEffect(() => {
    const MAP: Record<string, number> = { q: 0, w: 1, e: 2, r: 3, a: 4, s: 5, d: 6, f: 7 }
    const fn = (e: KeyboardEvent) => {
      if (!e.repeat) { const i = MAP[e.key.toLowerCase()]; if (i !== undefined) hitPad(i) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [hitPad])

  /* ── Tap tempo ── */
  const tapTempo = () => {
    const now  = Date.now()
    const taps = [...tapTimes.slice(-4), now]
    setTapTimes(taps)
    if (taps.length >= 2) {
      const avg = taps.slice(1).map((t, i) => t - taps[i]).reduce((a, b) => a + b) / (taps.length - 1)
      setBpm(Math.round(60000 / avg))
    }
  }

  const keys = 'QWER ASDF'.split(' ').join('')

  return (
    <section className={`section ${styles.console}`} id="console">
      <div className={styles.bgGlow} />
      <div className={styles.bgGrid} />

      <div className="container">

        {/* ── Section header ── */}
        <div ref={secRef} className={`${styles.header} ${isVisible ? styles.in : ''}`}>
          <span className="label">{t('console_label')}</span>
          <h2 className={`section-title ${styles.title}`}>
            {t('console_title1')}<br />
            <span className={styles.accent}>{t('console_title2')}</span>
          </h2>
          <p className={styles.sub}>{t('console_sub')}</p>
        </div>

        {/* ══ Machine unit ══ */}
        <div className={`${styles.unit} ${isVisible ? styles.in : ''}`} style={{ transitionDelay: '0.2s' }}>

          {/* ─ Control strip ─ */}
          <div className={styles.strip}>

            {/* Brand */}
            <div className={styles.brand}>
              <span className={styles.brandDot} />
              <span className={styles.brandName}>CONSOLE MK-2</span>
            </div>

            {/* BPM */}
            <div className={styles.bpmWrap}>
              <button className={styles.bpmBtn} onClick={() => setBpm(b => Math.max(60, b - 1))}>−</button>
              <div className={styles.bpmDisplay}>
                <span className={styles.bpmNum}>{bpm}</span>
                <span className={styles.bpmLabel}>BPM</span>
              </div>
              <button className={styles.bpmBtn} onClick={() => setBpm(b => Math.min(220, b + 1))}>+</button>
              <button className={styles.tapBtn} onClick={tapTempo}>TAP</button>
            </div>

            {/* Play */}
            <button
              className={`${styles.playBtn} ${isPlaying ? styles.playOn : ''}`}
              onClick={() => setIsPlaying(p => !p)}
            >
              <span>{isPlaying ? '■' : '▶'}</span>
              {isPlaying ? 'STOP' : 'PLAY'}
            </button>

            {/* Modes */}
            <div className={styles.modes}>
              {([
                ['RND', random, setRandom, '#FFE566'],
                ['GLT', glitch, setGlitch, '#FF2D9B'],
                ['ARP', arp,    setArp,    '#00F5FF'],
              ] as Array<[string, boolean, (_: boolean) => void, string]>).map(([l, v, fn, c]) => (
                <button
                  key={l}
                  className={`${styles.modeBtn} ${v ? styles.modeOn : ''}`}
                  style={v ? { '--mc': c } as CSSProperties : undefined}
                  onClick={() => fn(!v)}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* ─ Bank selector ─ */}
          <div className={styles.banks}>
            {ALL_BANKS.map((b, i) => (
              <button
                key={b.name}
                className={`${styles.bankBtn} ${bankIdx === i ? styles.bankOn : ''}`}
                style={bankIdx === i ? { '--bc': b.color } as CSSProperties : undefined}
                onClick={() => setBankIdx(i)}
              >
                <span className={styles.bankEmoji}>{b.emoji}</span>
                <span>{b.name}</span>
              </button>
            ))}
          </div>

          {/* ─ EQ strip ─ */}
          <div className={styles.eq}>
            {eqBars.map((h, i) => (
              <div
                key={i}
                className={styles.eqBar}
                style={{
                  height: `${Math.max(4, h * 100)}%`,
                  background: h > 0.7 ? '#FF2D9B' : h > 0.4 ? '#9B30FF' : '#4a0e8f',
                }}
              />
            ))}
          </div>

          {/* ─ 8 Pads — 4×2 ─ */}
          <div className={styles.pads}>
            {bank.pads.map((pad, i) => {
              const active = activePad === i
              return (
                <button
                  key={`${bankIdx}-${i}`}
                  className={`${styles.pad} ${active ? styles.padLit : ''}`}
                  style={{
                    '--pc': pad.color,
                    borderColor: active ? pad.color : undefined,
                    boxShadow: active
                      ? `0 0 20px ${pad.color}90, 0 0 50px ${pad.color}40, inset 0 0 18px ${pad.color}20`
                      : undefined,
                    background: active
                      ? `radial-gradient(circle at 50% 60%, ${pad.color}30 0%, transparent 70%), #0a0014`
                      : undefined,
                  } as CSSProperties}
                  onMouseDown={() => hitPad(i)}
                  onTouchStart={e => { e.preventDefault(); hitPad(i) }}
                >
                  {active && <span className={styles.ripple} style={{ background: pad.color }} />}
                  <span className={styles.padName}>{pad.name}</span>
                  <span className={styles.padKey}>{keys[i]}</span>
                </button>
              )
            })}
          </div>

          {/* ─ Step sequencer ─ */}
          <div className={styles.seqWrap}>
            <span className={styles.seqTitle}>{t('console_kick_seq')}</span>
            <div className={styles.seq}>
              {Array.from({ length: 16 }, (_, i) => (
                <button
                  key={i}
                  className={[
                    styles.seqStep,
                    seq[i]      ? styles.seqOn      : '',
                    step === i  ? styles.seqCur     : '',
                    i % 4 === 0 ? styles.seqBeat    : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSeq(a => { const n = [...a]; n[i] = !n[i]; return n })}
                />
              ))}
            </div>
          </div>

        </div>{/* /unit */}

        {/* ─ Callout ─ */}
        <div className={`${styles.callout} ${isVisible ? styles.in : ''}`} style={{ transitionDelay: '0.4s' }}>
          <span>🎧</span>
          <span dangerouslySetInnerHTML={{
            __html: t('console_callout').replace(
              'Pioneer CDJ-2000 NXS2',
              '<strong style="color:rgba(255,255,255,0.85)">Pioneer CDJ-2000 NXS2</strong>'
            )
          }}/>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto', flexShrink: 0 }} onClick={() => scrollTo('book')}>
            {t('console_booknow')}
          </button>
        </div>

      </div>
    </section>
  )
}
