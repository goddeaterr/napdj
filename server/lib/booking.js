/* ============================================================================
   Booking submission — validate → store → notify.
   Shared by the Express server and the Vercel function so both behave
   identically.
============================================================================ */
import { addBooking, markNotified } from './store.js'
import { sendOwnerNotification, sendClientConfirmation, formatDateLabel } from './mailer.js'

const LIMITS = { name: 120, email: 200, phone: 40, plan: 80, genre: 80, time: 10, message: 2000 }

const trim = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

function sanitise(body = {}) {
  return {
    name:         trim(body.name,    LIMITS.name),
    email:        trim(body.email,   LIMITS.email),
    phone:        trim(body.phone,   LIMITS.phone),
    plan:         trim(body.plan,    LIMITS.plan),
    genre:        trim(body.genre,   LIMITS.genre),
    time:         trim(body.time,    LIMITS.time),
    message:      trim(body.message, LIMITS.message),
    date:         typeof body.date === 'string' ? body.date : null,
    noPreference: Boolean(body.noPreference),
    consent:      Boolean(body.consent),
    lang:         ['en', 'ru', 'lt'].includes(body.lang) ? body.lang : 'en',
  }
}

function validate(data) {
  if (!data.name)  return 'Name is required'
  if (!data.email) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Email is not valid'
  if (!data.plan)  return 'Plan is required'
  if (!data.consent) return 'Consent to the Privacy Policy is required'
  return null
}

/**
 * Handles one submission.
 * Returns { ok, status, error?, booking?, warning? } — the caller only has to
 * map it onto its own response object.
 */
export async function submitBooking(body) {
  const data  = sanitise(body)
  const error = validate(data)
  if (error) return { ok: false, status: 400, error }

  let booking
  try {
    booking = await addBooking({ ...data, dateLabel: formatDateLabel(data) })
  } catch (err) {
    return { ok: false, status: 500, error: `Could not save the booking: ${err.message}` }
  }

  const owner  = await sendOwnerNotification(booking)
  const client = await sendClientConfirmation(booking)

  try {
    await markNotified(booking.id, {
      owner:  owner.sent  ? { via: owner.via }  : { failed: owner.error },
      client: client.sent ? { via: client.via } : { failed: client.error },
    })
  } catch { /* delivery bookkeeping is best-effort */ }

  return {
    ok: true,
    status: 200,
    booking,
    owner,
    client,
    // The request is stored and visible in the admin panel even when e-mail
    // delivery fails, so the visitor is never asked to submit twice.
    warning: owner.sent ? undefined : `Owner notification failed: ${owner.error}`,
  }
}
