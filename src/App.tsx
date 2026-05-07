import { useRef } from 'react'
import type { AudioCtxRef } from './lib/audio'
import CustomCursor    from './components/CustomCursor'
import ClickRipple     from './components/ClickRipple'
import ScrollProgress  from './components/ScrollProgress'
import ParticleCanvas  from './components/ParticleCanvas'
import Navbar          from './components/Navbar'
import Hero            from './components/Hero'
import BeatViz         from './components/BeatViz'
import { GraduatesMarquee, ClubsMarquee } from './components/Marquee'
import About           from './components/About'
import Learning        from './components/Learning'
import Countdown       from './components/Countdown'
import Gallery         from './components/Gallery'
import DJConsole       from './components/DJConsole'
import Testimonials    from './components/Testimonials'
import Pricing         from './components/Pricing'
import DJBuilder       from './components/DJBuilder'
import FAQ             from './components/FAQ'
import BookingForm     from './components/BookingForm'
import Footer          from './components/Footer'
import './styles/global.css'

export default function App() {
  const audioCtx: AudioCtxRef = useRef(null)

  return (
    <>
      {/* Global visual effects */}
      <CustomCursor />
      <ClickRipple />
      <ScrollProgress />

      {/* Background */}
      <ParticleCanvas />

      {/* Navigation */}
      <Navbar audioCtx={audioCtx} />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <GraduatesMarquee />
        <About />
        <Gallery />
        <ClubsMarquee />
        <Learning />

        {/* Beat visualizer before interactive console */}
        <BeatViz height={90} />

        <DJConsole audioCtx={audioCtx} />

        {/* Beat visualizer after console */}
        <BeatViz height={72} />

        <Pricing />
        <Countdown />
        <DJBuilder />
        <BookingForm />
        <Testimonials />
        <FAQ />
      </main>

      <Footer />
    </>
  )
}
