/* ============================================================================
   Account HTTP handlers — shared by the Express server and the Vercel
   function, so both runtimes behave identically.

   CSRF: the session cookie is SameSite=Lax, which already stops cross-site
   form posts from carrying it. On top of that every mutating call must be
   JSON, which a cross-origin form cannot send without a preflight.
============================================================================ */
import {
  register, verifyEmail, login, requestPasswordReset, resetPassword,
  resendVerification, currentUser, accountOverview, publicUser, cancelBooking,
} from './accounts.js'
import { sessionCookie, clearCookie } from './accountAuth.js'
import { clientIp } from './auth.js'

function wantsJson(req) {
  const type = req.headers?.['content-type'] || ''
  return type.includes('application/json')
}

const send = (res, status, body) => res.status(status).json(body)

/**
 * All account endpoints behind one entry point.
 * `action` comes from the path: /api/auth/<action>
 */
export async function handleAuth(action, req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const method = req.method || 'GET'
  const ip = clientIp(req)

  if (method === 'OPTIONS') return res.status(204).end()

  // Everything except `me` changes state and must be a JSON POST.
  if (action !== 'me') {
    if (method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' })
    if (!wantsJson(req))   return send(res, 415, { ok: false, error: 'json_required' })
  }

  const body = req.body || {}

  switch (action) {
    case 'register': {
      const result = await register(body, ip)
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error })
      return send(res, 200, { ok: true })
    }

    case 'verify': {
      const result = await verifyEmail(body.token)
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error })
      res.setHeader('Set-Cookie', sessionCookie(result.session))
      return send(res, 200, { ok: true, user: result.user })
    }

    case 'resend': {
      const result = await resendVerification(body.email, ip)
      return send(res, result.status, { ok: result.ok, error: result.error })
    }

    case 'login': {
      const result = await login(body, ip)
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error })
      res.setHeader('Set-Cookie', sessionCookie(result.session))
      return send(res, 200, { ok: true, user: result.user })
    }

    case 'logout': {
      res.setHeader('Set-Cookie', clearCookie())
      return send(res, 200, { ok: true })
    }

    case 'forgot': {
      const result = await requestPasswordReset(body.email, ip)
      return send(res, result.status, { ok: result.ok, error: result.error })
    }

    case 'reset': {
      const result = await resetPassword(body)
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error })
      res.setHeader('Set-Cookie', sessionCookie(result.session))
      return send(res, 200, { ok: true, user: result.user })
    }

    case 'cancel': {
      const user = await currentUser(req)
      const result = await cancelBooking(String(body.id || ''), user)
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error })
      return send(res, 200, { ok: true })
    }

    case 'me': {
      if (method !== 'GET') return send(res, 405, { ok: false, error: 'method_not_allowed' })
      const user = await currentUser(req)
      if (!user) return send(res, 200, { ok: true, user: null })
      return send(res, 200, { ok: true, ...(await accountOverview(user)) })
    }

    default:
      return send(res, 404, { ok: false, error: 'unknown_action' })
  }
}

export { publicUser }
