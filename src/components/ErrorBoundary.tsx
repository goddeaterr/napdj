import { Component, type ReactNode } from 'react'
import { CONTACT } from '../config/site'

interface Props { children: ReactNode }
interface State { failed: boolean }

/**
 * Keeps a rendering error from leaving the visitor with a blank page — they
 * still get a way to contact the studio.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled UI error:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '14px',
        textAlign: 'center', padding: '40px 24px', background: '#0A0A0A',
        color: '#fff', fontFamily: 'Barlow, sans-serif',
      }}>
        <h1 style={{ fontSize: '28px', letterSpacing: '.04em', textTransform: 'uppercase' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '44ch', lineHeight: 1.7 }}>
          Please reload the page. If it keeps happening, contact us directly and
          we will take your booking by e-mail or phone.
        </p>
        <p style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={`mailto:${CONTACT.email}`} style={{ color: '#fff' }}>{CONTACT.email}</a>
          <a href={`tel:${CONTACT.phoneHref}`} style={{ color: '#fff' }}>{CONTACT.phone}</a>
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    )
  }
}
