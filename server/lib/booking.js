/* ============================================================================
   Booking submission — validate → store → notify.
   Shared by the Express server and the Vercel function so both behave
   identically.
============================================================================ */
import { randomUUID } from 'node:crypto'
import { addBooking, markNotified, listTakenSlots } from './store.js'
import { sendOwnerNotification, sendClientConfirmation, formatDateLabel } from './mailer.js'

const LIMITS = { name: 120, email: 200, phone: 40, plan: 80, genre: 80, time: 10, message: 2000 }

/* ── Spam protection ──────────────────────────────────────────────────────
   Per-IP submission limit. In-memory, so on serverless it is per instance —
   still enough to stop a naive flood, and the honeypot below catches most
   bots before they ever get here.                                        */
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5
const recent = new Map()   // ip -> { count, resetAt }

function withinRateLimit(ip) {
  if (!ip) return true
  const now = Date.now()
  const entry = recent.get(ip)
  if (!entry || now > entry.resetAt) {
    recent.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= MAX_PER_WINDOW
}

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
    // Keep only the calendar part, so an ISO timestamp can never sneak through.
    date:         typeof body.date === 'string' ? body.date.slice(0, 10) : null,
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
export async function submitBooking(body, ip, account = null) {
  // Honeypot: a field hidden from humans. Anything in it is a bot — answer
  // with a normal success so the bot has nothing to learn, and store nothing.
  if (typeof body?.company === 'string' && body.company.trim() !== '') {
    return { ok: true, status: 200, discarded: true, owner: { sent: false }, client: { sent: false } }
  }

  if (!withinRateLimit(ip)) {
    return { ok: false, status: 429, error: 'Too many requests. Please try again later.' }
  }

  /* Bookings belong to an account. Identity comes from the session, never
     from the request body, so nobody can book in someone else's name. */
  if (!account) {
    return { ok: false, status: 401, code: 'sign_in_required', error: 'Please sign in to book a lesson' }
  }
  if (!account.emailVerified) {
    return { ok: false, status: 403, code: 'verify_email_required', error: 'Please confirm your e-mail address first' }
  }

  const data = {
    ...sanitise(body),
    name:   account.name,
    email:  account.email,
    phone:  String(body.phone || account.phone || '').trim().slice(0, 40),
    userId: account.id,
    consent: true,          // recorded at sign-up
  }

  const error = validate(data)
  if (error) return { ok: false, status: 400, error }

  /* Refuse a slot somebody else already holds. The calendar greys these out,
     but two people can still submit the same slot seconds apart, so the check
     has to happen here as well. */
  if (data.date && data.time && !data.noPreference) {
    try {
      const taken = await listTakenSlots(data.date)
      if (taken.some(s => s.date === data.date && s.time === data.time)) {
        return { ok: false, status: 409, code: 'slot_taken', error: 'That time slot has just been taken' }
      }
    } catch {
      // If availability cannot be read, accept the booking rather than turn a
      // real customer away — a duplicate is easier to fix than a lost enquiry.
    }
  }

  const record = { ...data, dateLabel: formatDateLabel(data) }

  /* Storage and e-mail are two independent ways of not losing an enquiry.
     Either one succeeding is enough to accept the booking, so a misconfigured
     database never turns a real customer away. */
  let booking
  let storageError
  try {
    booking = await addBooking(record)
  } catch (err) {
    storageError = err.message
    booking = { id: `unsaved-${randomUUID()}`, createdAt: new Date().toISOString(), status: 'new', ...record }
  }

  const owner = await sendOwnerNotification(booking)

  /* Only promise the student a reply once the enquiry has actually landed
     somewhere — in the database or in the owner's inbox. Confirming a booking
     nobody can see would be worse than showing an honest error. */
  const captured = !storageError || owner.sent
  const client = captured
    ? await sendClientConfirmation(booking)
    : { sent: false, error: 'Skipped — the enquiry could not be recorded' }

  if (!storageError) {
    try {
      await markNotified(booking.id, {
        owner:  owner.sent  ? { via: owner.via }  : { failed: owner.error },
        client: client.sent ? { via: client.via } : { failed: client.error },
      })
    } catch { /* delivery bookkeeping is best-effort */ }
  }

  // Nothing recorded and nobody notified — this one really did fail.
  if (storageError && !owner.sent) {
    return {
      ok: false,
      status: 500,
      error: 'Could not process the booking',
      storageError,
      owner,
      client,
      stored: false,
    }
  }

  const warnings = []
  if (storageError) warnings.push(`Booking was NOT stored: ${storageError}`)
  if (!owner.sent)  warnings.push(`Owner notification failed: ${owner.error}`)

  return {
    ok: true,
    status: 200,
    booking,
    owner,
    client,
    stored: !storageError,
    warning: warnings.length ? warnings.join(' · ') : undefined,
  }
}
