// ═══════════════════════════════════════════════
// neko art — Audio Engine
// Procedural ambient music + pad sounds
// ═══════════════════════════════════════════════

export type AudioCtxRef = { current: AudioContext | null }

export function getAudioContext(ref: AudioCtxRef): AudioContext {
  if (!ref.current) {
    ref.current = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (ref.current.state === 'suspended') ref.current.resume()
  return ref.current
}

// ── Ambient music engine ──────────────────────
export class AmbientEngine {
  private ctx: AudioContext
  private master: GainNode
  private nodes: AudioNode[] = []
  private oscNodes: OscillatorNode[] = []
  private isRunning = false

  constructor(ctx: AudioContext) {
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.buildAmbient()
    this.master.gain.setTargetAtTime(0.28, this.ctx.currentTime, 2.5)
  }

  stop() {
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 2)
    setTimeout(() => {
      this.oscNodes.forEach(o => { try { o.stop() } catch {} })
      this.oscNodes = []
      this.nodes = []
      this.isRunning = false
    }, 5000)
  }

  setVolume(v: number) {
    this.master.gain.setTargetAtTime(v * 0.35, this.ctx.currentTime, 0.3)
  }

  private buildAmbient() {
    const ctx = this.ctx

    // ── Drone bass layer ──
    const dronePairs: [number, number][] = [
      [55, 0.18],   // A1
      [82.4, 0.12], // E2
      [110, 0.08],  // A2
    ]
    dronePairs.forEach(([freq, gain]) => {
      const osc = ctx.createOscillator()
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      const g = ctx.createGain()
      const flt = ctx.createBiquadFilter()

      osc.type = 'sine'
      osc.frequency.value = freq
      lfo.type = 'sine'
      lfo.frequency.value = 0.05 + Math.random() * 0.08
      lfoGain.gain.value = freq * 0.003
      flt.type = 'lowpass'
      flt.frequency.value = 300
      flt.Q.value = 0.5
      g.gain.value = gain

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      osc.connect(flt)
      flt.connect(g)
      g.connect(this.master)

      osc.start(); lfo.start()
      this.oscNodes.push(osc, lfo)
    })

    // ── Pad chord layer ──
    // Am chord voicing (A-C-E-G)
    const chordFreqs = [220, 261.6, 329.6, 392, 440, 523.2]
    chordFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const lfo = ctx.createOscillator()
      const lfoG = ctx.createGain()
      const g = ctx.createGain()
      const flt = ctx.createBiquadFilter()
      const reverb = this.createSimpleReverb(3.5)

      osc.type = 'triangle'
      osc.frequency.value = freq
      lfo.type = 'sine'
      lfo.frequency.value = 0.03 + i * 0.007
      lfoG.gain.value = 0.5
      flt.type = 'lowpass'
      flt.frequency.value = 1200
      flt.Q.value = 0.8
      g.gain.value = 0.045

      lfo.connect(lfoG); lfoG.connect(osc.frequency)
      osc.connect(flt); flt.connect(g)
      g.connect(reverb); reverb.connect(this.master)
      g.connect(this.master)

      // Slow fade in stagger
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.setTargetAtTime(0.045, ctx.currentTime + i * 0.8, 3)

      osc.start(); lfo.start()
      this.oscNodes.push(osc, lfo)
    })

    // ── Hi melody arpeggio ──
    const scale = [880, 988, 1047, 1175, 1319, 1397, 1568] // A major / A aeolian
    let step = 0
    const arpInterval = setInterval(() => {
      if (!this.isRunning) { clearInterval(arpInterval); return }
      const freq = scale[Math.floor(Math.random() * scale.length)]
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      const rev = this.createSimpleReverb(2)

      osc.type = 'sine'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.setTargetAtTime(0.022, ctx.currentTime, 0.04)
      g.gain.setTargetAtTime(0, ctx.currentTime + 0.9, 0.4)

      osc.connect(g); g.connect(rev); rev.connect(this.master)
      osc.start(); osc.stop(ctx.currentTime + 2.5)
      step++
    }, 1800 + Math.random() * 1200)

    // ── Noise texture (vinyl crackle feel) ──
    const bufSize = ctx.sampleRate * 4
    const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    // Pink-ish noise
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0
    for (let i=0; i<bufSize; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886*b0 + w*0.0555179
      b1 = 0.99332*b1 + w*0.0750759
      b2 = 0.96900*b2 + w*0.1538520
      b3 = 0.86650*b3 + w*0.3104856
      b4 = 0.55000*b4 + w*0.5329522
      b5 = -0.7616*b5 - w*0.0168980
      data[i] = (b0+b1+b2+b3+b4+b5+w*0.5362) * 0.04
    }
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuf
    noiseSource.loop = true
    const noiseFlt = ctx.createBiquadFilter()
    noiseFlt.type = 'bandpass'
    noiseFlt.frequency.value = 3000
    noiseFlt.Q.value = 0.5
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.006
    noiseSource.connect(noiseFlt)
    noiseFlt.connect(noiseGain)
    noiseGain.connect(this.master)
    noiseSource.start()
    this.nodes.push(noiseSource)
  }

  private createSimpleReverb(duration: number): ConvolverNode {
    const ctx = this.ctx
    const length = ctx.sampleRate * duration
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let ch=0; ch<2; ch++) {
      const d = impulse.getChannelData(ch)
      for (let i=0; i<length; i++) {
        d[i] = (Math.random()*2-1) * Math.pow(1 - i/length, 2.5)
      }
    }
    const node = ctx.createConvolver()
    node.buffer = impulse
    return node
  }
}

// ── Pad sound synthesizers ─────────────────────
export interface PadSound {
  name: string
  color: string
  synth: (ctx: AudioContext, dest: AudioNode, velocity?: number) => void
}

// Helper: create reverb
function mkRev(ctx: AudioContext, dur=1.5): ConvolverNode {
  const len = ctx.sampleRate * dur
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch=0; ch<2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i=0; i<len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2)
  }
  const node = ctx.createConvolver(); node.buffer = buf; return node
}

// Helper: make gain envelope
function env(ctx: AudioContext, g: GainNode, at=0.005, sus=0.1, rel=0.3, vol=0.5) {
  const t = ctx.currentTime
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + at)
  g.gain.setTargetAtTime(sus * vol, t + at, 0.05)
  g.gain.setTargetAtTime(0, t + at + 0.05 + rel, rel * 0.4)
}

// ── NEKO bank ──────────────────────────────────
export const NEKO_BANK: PadSound[] = [
  {
    name: 'Mew',
    color: '#FF2D9B',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      const flt = ctx.createBiquadFilter()
      osc.type = 'sine'; osc.frequency.value = 800
      osc.frequency.setTargetAtTime(1200, ctx.currentTime, 0.03)
      osc.frequency.setTargetAtTime(700, ctx.currentTime + 0.08, 0.06)
      flt.type = 'bandpass'; flt.frequency.value = 1000; flt.Q.value = 3
      osc.connect(flt); flt.connect(g); g.connect(dest)
      env(ctx, g, 0.01, 0.3, 0.25, 0.45 * v); osc.start(); osc.stop(ctx.currentTime + 0.5)
    }
  },
  {
    name: 'Purr',
    color: '#9B30FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator()
      const lfo = ctx.createOscillator()
      const lfoG = ctx.createGain()
      const g = ctx.createGain()
      osc.type = 'sawtooth'; osc.frequency.value = 65
      lfo.type = 'sine'; lfo.frequency.value = 25
      lfoG.gain.value = 30
      lfo.connect(lfoG); lfoG.connect(osc.frequency)
      osc.connect(g); g.connect(dest)
      env(ctx, g, 0.01, 0.6, 0.5, 0.35 * v)
      osc.start(); lfo.start(); osc.stop(ctx.currentTime+1.2); lfo.stop(ctx.currentTime+1.2)
    }
  },
  {
    name: 'Scratch',
    color: '#00F5FF',
    synth(ctx, dest, v=1) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i=0; i<d.length; i++) d[i] = (Math.random()*2-1) * (1-i/d.length)
      const src = ctx.createBufferSource()
      src.buffer = buf
      const flt = ctx.createBiquadFilter()
      flt.type = 'bandpass'; flt.frequency.value = 4000; flt.Q.value = 2
      const g = ctx.createGain(); g.gain.value = 0.8 * v
      src.connect(flt); flt.connect(g); g.connect(dest)
      src.start()
    }
  },
  {
    name: 'Hiss',
    color: '#FFE566',
    synth(ctx, dest, v=1) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
      const d = buf.getChannelData(0); for (let i=0; i<d.length; i++) d[i] = Math.random()*2-1
      const src = ctx.createBufferSource(); src.buffer = buf
      const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=8000
      const g = ctx.createGain(); g.gain.value = 0.5 * v
      src.connect(flt); flt.connect(g); g.connect(dest); src.start()
    }
  },
  {
    name: 'Yowl',
    color: '#FF6B30',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      const flt = ctx.createBiquadFilter()
      osc.type = 'sawtooth'; osc.frequency.value = 500
      osc.frequency.setTargetAtTime(200, ctx.currentTime, 0.15)
      flt.type = 'bandpass'; flt.frequency.value = 600; flt.Q.value = 4
      osc.connect(flt); flt.connect(g); g.connect(dest)
      env(ctx, g, 0.02, 0.4, 0.5, 0.5 * v); osc.start(); osc.stop(ctx.currentTime+0.9)
    }
  },
  {
    name: 'Paw',
    color: '#9B30FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'triangle'; osc.frequency.value = 300
      osc.frequency.setTargetAtTime(50, ctx.currentTime, 0.04)
      osc.connect(g); g.connect(dest)
      env(ctx, g, 0.001, 0, 0.08, 0.5 * v); osc.start(); osc.stop(ctx.currentTime+0.15)
    }
  },
  {
    name: 'Bell',
    color: '#00F5FF',
    synth(ctx, dest, v=1) {
      const freqs = [1000, 2756, 4100]
      const rev = mkRev(ctx, 2)
      rev.connect(dest)
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain()
        osc.type = 'sine'; osc.frequency.value = f
        osc.connect(g); g.connect(rev); g.connect(dest)
        g.gain.setValueAtTime(0, ctx.currentTime)
        g.gain.linearRampToValueAtTime((0.3-i*0.07)*v, ctx.currentTime+0.005)
        g.gain.setTargetAtTime(0, ctx.currentTime+0.01, 0.4+i*0.2)
        osc.start(); osc.stop(ctx.currentTime+2)
      })
    }
  },
  {
    name: 'Chirp',
    color: '#FF2D9B',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = 400
      osc.frequency.linearRampToValueAtTime(1600, ctx.currentTime+0.05)
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime+0.1)
      osc.connect(g); g.connect(dest)
      env(ctx, g, 0.002, 0, 0.1, 0.4*v); osc.start(); osc.stop(ctx.currentTime+0.2)
    }
  },
]

// ── SYNTH bank ─────────────────────────────────
export const SYNTH_BANK: PadSound[] = [
  {
    name: 'Acid',
    color: '#00F5FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const flt = ctx.createBiquadFilter(); const g = ctx.createGain()
      osc.type = 'sawtooth'; osc.frequency.value = 110
      flt.type = 'lowpass'; flt.frequency.setValueAtTime(300, ctx.currentTime)
      flt.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime+0.08)
      flt.frequency.exponentialRampToValueAtTime(200, ctx.currentTime+0.3)
      flt.Q.value = 12
      osc.connect(flt); flt.connect(g); g.connect(dest)
      env(ctx, g, 0.005, 0.5, 0.3, 0.55*v); osc.start(); osc.stop(ctx.currentTime+0.6)
    }
  },
  {
    name: 'Laser',
    color: '#9B30FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(2000, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime+0.25)
      osc.connect(g); g.connect(dest)
      env(ctx, g, 0.001, 0, 0.25, 0.5*v); osc.start(); osc.stop(ctx.currentTime+0.4)
    }
  },
  {
    name: 'Stab',
    color: '#FF2D9B',
    synth(ctx, dest, v=1) {
      const freqs = [220, 277, 330]
      freqs.forEach(f => {
        const osc = ctx.createOscillator(); const g = ctx.createGain()
        osc.type = 'sawtooth'; osc.frequency.value = f
        osc.connect(g); g.connect(dest)
        env(ctx, g, 0.003, 0, 0.12, 0.25*v); osc.start(); osc.stop(ctx.currentTime+0.3)
      })
    }
  },
  {
    name: 'Wobble',
    color: '#FFE566',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const lfo = ctx.createOscillator()
      const lfoG = ctx.createGain(); const flt = ctx.createBiquadFilter(); const g = ctx.createGain()
      osc.type = 'sawtooth'; osc.frequency.value = 55
      lfo.type = 'sine'; lfo.frequency.value = 4; lfoG.gain.value = 1500
      flt.type = 'lowpass'; flt.frequency.value = 800; flt.Q.value = 6
      lfo.connect(lfoG); lfoG.connect(flt.frequency)
      osc.connect(flt); flt.connect(g); g.connect(dest)
      env(ctx, g, 0.01, 0.6, 0.4, 0.6*v)
      osc.start(); lfo.start(); osc.stop(ctx.currentTime+1); lfo.stop(ctx.currentTime+1)
    }
  },
  {
    name: 'Pluck',
    color: '#00F5FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type = 'triangle'; osc.frequency.value = 440
      osc.connect(g); g.connect(dest)
      g.gain.setValueAtTime(0.6*v, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5)
      osc.start(); osc.stop(ctx.currentTime+0.6)
    }
  },
  {
    name: 'Zap',
    color: '#9B30FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type = 'square'; osc.frequency.setValueAtTime(3000, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime+0.12)
      osc.connect(g); g.connect(dest)
      env(ctx, g, 0.001, 0, 0.12, 0.4*v); osc.start(); osc.stop(ctx.currentTime+0.2)
    }
  },
  {
    name: 'Pad',
    color: '#FF2D9B',
    synth(ctx, dest, v=1) {
      const freqs = [220, 261.6, 329.6]; const rev = mkRev(ctx, 3); rev.connect(dest)
      freqs.forEach(f => {
        const osc = ctx.createOscillator(); const g = ctx.createGain()
        osc.type = 'sine'; osc.frequency.value = f
        osc.connect(g); g.connect(rev)
        env(ctx, g, 0.15, 0.7, 0.8, 0.22*v); osc.start(); osc.stop(ctx.currentTime+2.5)
      })
    }
  },
  {
    name: 'Glitch',
    color: '#FFE566',
    synth(ctx, dest, v=1) {
      for (let i=0; i<6; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator(); const g = ctx.createGain()
          osc.type = 'square'
          osc.frequency.value = 200 + Math.random()*2000
          osc.connect(g); g.connect(dest)
          g.gain.value = 0.2 * v; osc.start(); osc.stop(ctx.currentTime+0.03)
        }, i * 35 + Math.random()*20)
      }
    }
  },
]

// ── KIT bank ───────────────────────────────────
export const KIT_BANK: PadSound[] = [
  {
    name: 'Kick',
    color: '#9B30FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type = 'sine'; osc.frequency.setValueAtTime(180, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime+0.28)
      g.gain.setValueAtTime(0.9*v, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.35)
      osc.connect(g); g.connect(dest); osc.start(); osc.stop(ctx.currentTime+0.4)
    }
  },
  {
    name: 'Snare',
    color: '#FF2D9B',
    synth(ctx, dest, v=1) {
      const len = ctx.sampleRate*0.12; const buf = ctx.createBuffer(1,len,ctx.sampleRate)
      const d = buf.getChannelData(0); for (let i=0; i<len; i++) d[i] = Math.random()*2-1
      const src = ctx.createBufferSource(); src.buffer = buf
      const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=1400
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.55*v, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.18)
      src.connect(flt); flt.connect(g); g.connect(dest); src.start()

      // tone layer
      const osc2 = ctx.createOscillator(); const g2 = ctx.createGain()
      osc2.type='sine'; osc2.frequency.value=180
      osc2.frequency.exponentialRampToValueAtTime(60, ctx.currentTime+0.08)
      g2.gain.setValueAtTime(0.4*v, ctx.currentTime)
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.12)
      osc2.connect(g2); g2.connect(dest); osc2.start(); osc2.stop(ctx.currentTime+0.2)
    }
  },
  {
    name: 'Hi-Hat',
    color: '#00F5FF',
    synth(ctx, dest, v=1) {
      const len = ctx.sampleRate*0.06; const buf = ctx.createBuffer(1,len,ctx.sampleRate)
      const d = buf.getChannelData(0); for (let i=0; i<len; i++) d[i] = Math.random()*2-1
      const src = ctx.createBufferSource(); src.buffer = buf
      const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=9000
      const g = ctx.createGain(); g.gain.value=0.35*v
      src.connect(flt); flt.connect(g); g.connect(dest); src.start()
    }
  },
  {
    name: 'Open HH',
    color: '#FFE566',
    synth(ctx, dest, v=1) {
      const len = ctx.sampleRate*0.3; const buf = ctx.createBuffer(1,len,ctx.sampleRate)
      const d = buf.getChannelData(0); for (let i=0; i<len; i++) d[i] = Math.random()*2-1
      const src = ctx.createBufferSource(); src.buffer = buf
      const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=8000
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.3*v, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.3)
      src.connect(flt); flt.connect(g); g.connect(dest); src.start()
    }
  },
  {
    name: 'Clap',
    color: '#FF2D9B',
    synth(ctx, dest, v=1) {
      [0, 0.012, 0.028].forEach(delay => {
        setTimeout(() => {
          const len = ctx.sampleRate*0.05; const buf = ctx.createBuffer(1,len,ctx.sampleRate)
          const d = buf.getChannelData(0); for (let i=0; i<len; i++) d[i] = Math.random()*2-1
          const src = ctx.createBufferSource(); src.buffer = buf
          const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=1200; flt.Q.value=0.8
          const g = ctx.createGain(); g.gain.value=0.5*v
          src.connect(flt); flt.connect(g); g.connect(dest); src.start()
        }, delay*1000)
      })
    }
  },
  {
    name: 'Tom',
    color: '#9B30FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type='sine'; osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime+0.2)
      g.gain.setValueAtTime(0.6*v, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.25)
      osc.connect(g); g.connect(dest); osc.start(); osc.stop(ctx.currentTime+0.3)
    }
  },
  {
    name: 'Rim',
    color: '#00F5FF',
    synth(ctx, dest, v=1) {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      const len = ctx.sampleRate*0.04; const buf = ctx.createBuffer(1,len,ctx.sampleRate)
      const d = buf.getChannelData(0); for (let i=0; i<len; i++) d[i] = Math.random()*2-1
      const src = ctx.createBufferSource(); src.buffer = buf
      const g2 = ctx.createGain(); g2.gain.value = 0.35*v
      src.connect(g2); g2.connect(dest); src.start()

      osc.type='triangle'; osc.frequency.value=500
      g.gain.setValueAtTime(0.4*v, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.04)
      osc.connect(g); g.connect(dest); osc.start(); osc.stop(ctx.currentTime+0.06)
    }
  },
  {
    name: 'Cymbal',
    color: '#FFE566',
    synth(ctx, dest, v=1) {
      const freqs=[215.5, 355, 461, 715, 880, 1100]
      freqs.forEach(f => {
        const osc = ctx.createOscillator(); const g = ctx.createGain()
        osc.type='square'; osc.frequency.value=f
        const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=5000
        osc.connect(flt); flt.connect(g); g.connect(dest)
        g.gain.setValueAtTime(0.06*v, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+1.2)
        osc.start(); osc.stop(ctx.currentTime+1.5)
      })
    }
  },
]

// ── AMBIENT bank ───────────────────────────────
export const AMBIENT_BANK: PadSound[] = [
  {
    name: 'Space',
    color: '#9B30FF',
    synth(ctx, dest, v=1) {
      const rev = mkRev(ctx, 5); rev.connect(dest)
      const freqs=[200,300,500]
      freqs.forEach((f,i) => {
        const osc=ctx.createOscillator(); const g=ctx.createGain()
        osc.type='sine'; osc.frequency.value=f*(0.99+Math.random()*0.02)
        osc.connect(g); g.connect(rev)
        env(ctx, g, 0.2, 0.7, 1.5, 0.15*v)
        osc.start(); osc.stop(ctx.currentTime+3)
      })
    }
  },
  {
    name: 'Rain',
    color: '#00F5FF',
    synth(ctx, dest, v=1) {
      for (let i=0; i<20; i++) {
        setTimeout(() => {
          const buf = ctx.createBuffer(1, ctx.sampleRate*0.1, ctx.sampleRate)
          const d = buf.getChannelData(0); for (let j=0; j<d.length; j++) d[j] = Math.random()*2-1
          const src = ctx.createBufferSource(); src.buffer=buf
          const flt = ctx.createBiquadFilter(); flt.type='bandpass'
          flt.frequency.value = 2000+Math.random()*3000
          const g = ctx.createGain(); g.gain.value = 0.04*v
          src.connect(flt); flt.connect(g); g.connect(dest); src.start()
        }, Math.random()*500)
      }
    }
  },
  {
    name: 'Chime',
    color: '#FFE566',
    synth(ctx, dest, v=1) {
      const scale=[523,659,784,1047,1319]
      const rev=mkRev(ctx,3); rev.connect(dest)
      scale.forEach((f,i) => {
        setTimeout(() => {
          const osc=ctx.createOscillator(); const g=ctx.createGain()
          osc.type='sine'; osc.frequency.value=f
          osc.connect(g); g.connect(rev); g.connect(dest)
          g.gain.setValueAtTime(0.25*v,ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+2)
          osc.start(); osc.stop(ctx.currentTime+2.5)
        }, i*120)
      })
    }
  },
  {
    name: 'Tide',
    color: '#FF2D9B',
    synth(ctx, dest, v=1) {
      const len=ctx.sampleRate*2; const buf=ctx.createBuffer(1,len,ctx.sampleRate)
      const d=buf.getChannelData(0); for (let i=0; i<len; i++) d[i]=Math.random()*2-1
      const src=ctx.createBufferSource(); src.buffer=buf
      const flt=ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=600
      const lfo=ctx.createOscillator(); const lfoG=ctx.createGain()
      lfo.type='sine'; lfo.frequency.value=0.2; lfoG.gain.value=400
      lfo.connect(lfoG); lfoG.connect(flt.frequency)
      const g=ctx.createGain(); g.gain.setValueAtTime(0,ctx.currentTime)
      g.gain.setTargetAtTime(0.4*v, ctx.currentTime, 0.3)
      g.gain.setTargetAtTime(0, ctx.currentTime+1.5, 0.3)
      src.connect(flt); flt.connect(g); g.connect(dest)
      src.start(); lfo.start(); src.stop(ctx.currentTime+3); lfo.stop(ctx.currentTime+3)
    }
  },
  {
    name: 'Forest',
    color: '#9B30FF',
    synth(ctx, dest, v=1) {
      // Bird-like chirps
      for (let i=0; i<4; i++) {
        setTimeout(() => {
          const osc=ctx.createOscillator(); const g=ctx.createGain()
          osc.type='sine'; const base=800+Math.random()*800
          osc.frequency.setValueAtTime(base, ctx.currentTime)
          osc.frequency.setTargetAtTime(base*1.3, ctx.currentTime, 0.02)
          osc.connect(g); g.connect(dest)
          env(ctx, g, 0.01, 0, 0.08, 0.2*v); osc.start(); osc.stop(ctx.currentTime+0.15)
        }, i*180+Math.random()*100)
      }
    }
  },
  {
    name: 'Cosmos',
    color: '#00F5FF',
    synth(ctx, dest, v=1) {
      const rev=mkRev(ctx,6); rev.connect(dest)
      for (let i=0; i<5; i++) {
        const osc=ctx.createOscillator(); const lfo=ctx.createOscillator()
        const lfoG=ctx.createGain(); const g=ctx.createGain()
        const f=55*Math.pow(2, [0,7,12,16,21][i]/12)
        osc.type='sine'; osc.frequency.value=f
        lfo.type='sine'; lfo.frequency.value=0.1+i*0.03; lfoG.gain.value=f*0.01
        lfo.connect(lfoG); lfoG.connect(osc.frequency)
        osc.connect(g); g.connect(rev)
        env(ctx, g, 0.4, 0.8, 1.5, 0.12*v)
        osc.start(); lfo.start(); osc.stop(ctx.currentTime+4); lfo.stop(ctx.currentTime+4)
      }
    }
  },
  {
    name: 'Dream',
    color: '#FF2D9B',
    synth(ctx, dest, v=1) {
      const rev=mkRev(ctx,4); rev.connect(dest)
      const freqs=[261.6,329.6,392,523.2]
      freqs.forEach((f,i) => {
        const osc=ctx.createOscillator(); const g=ctx.createGain()
        osc.type='triangle'; osc.frequency.value=f
        osc.connect(g); g.connect(rev)
        env(ctx, g, 0.3+i*0.1, 0.8, 1.2, 0.18*v)
        osc.start(); osc.stop(ctx.currentTime+3.5)
      })
    }
  },
  {
    name: 'Portal',
    color: '#FFE566',
    synth(ctx, dest, v=1) {
      const rev=mkRev(ctx,3); rev.connect(dest)
      for (let i=0; i<8; i++) {
        const osc=ctx.createOscillator(); const g=ctx.createGain()
        osc.type='sine'
        osc.frequency.setValueAtTime(1000+i*200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime+0.5)
        osc.connect(g); g.connect(rev)
        g.gain.setValueAtTime(0.1*v, ctx.currentTime+i*0.04)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5+i*0.04)
        osc.start(ctx.currentTime+i*0.04); osc.stop(ctx.currentTime+1)
      }
    }
  },
]

export const ALL_BANKS = [
  { name: 'NEKO',    emoji: '🐾', color: '#FF2D9B', pads: NEKO_BANK    },
  { name: 'SYNTH',   emoji: '🎛️',  color: '#00F5FF', pads: SYNTH_BANK  },
  { name: 'KIT',     emoji: '🥁',  color: '#9B30FF', pads: KIT_BANK    },
  { name: 'AMBIENT', emoji: '🌙', color: '#FFE566', pads: AMBIENT_BANK },
]
