/* ============================================================================
   Which slots are already booked.

   This is a PUBLIC endpoint, so it exposes nothing but dates and times — no
   name, e-mail, phone or message ever leaves the database for this query.

   Nothing needs to be released by hand: availability is derived from the
   bookings themselves, so deleting a booking in the admin panel, or setting
   it to "cancelled", frees the slot on the next request.
============================================================================ */
import { listTakenSlots } from './store.js'

function todayISO() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Returns { taken: { 'YYYY-MM-DD': ['18:00', …] } } for upcoming dates.
 * Grouped by date so the calendar can look a day up directly.
 */
export async function getAvailability() {
  const slots = await listTakenSlots(todayISO())

  const taken = {}
  for (const { date, time } of slots) {
    (taken[date] ||= []).push(time)
  }
  for (const date of Object.keys(taken)) {
    taken[date] = [...new Set(taken[date])].sort()
  }

  return { ok: true, taken }
}
