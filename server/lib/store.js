/* ============================================================================
   Booking store — picks a backend based on the environment.

   • Supabase  when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
     This is what production should use: Vercel's filesystem is temporary, so
     without it the reservation history disappears when an instance recycles.
     Set the table up first with supabase/schema.sql.

   • JSON file otherwise ($DATA_DIR/bookings.json, defaults to ./data).
     Fine for local development and for self-hosted Node deployments.

   Both backends expose the same functions, so nothing else in the codebase
   needs to know which one is active.
============================================================================ */
import * as fileStore from './stores/file.js'
import * as supabaseStore from './stores/supabase.js'

const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

const backend = useSupabase ? supabaseStore : fileStore

export const storeName        = backend.name
export const storeDescription = backend.description
/** True when bookings survive a restart of the hosting environment. */
export const storeIsPersistent = useSupabase || !process.env.VERCEL

export const listBookings   = backend.listBookings
export const addBooking     = backend.addBooking
export const listTakenSlots = backend.listTakenSlots

/** Admin edits — only status and note may be changed. */
export async function updateBooking(id, patch) {
  const allowed = {}
  if (typeof patch.status === 'string') allowed.status = patch.status
  if (typeof patch.note   === 'string') allowed.note   = patch.note.slice(0, 2000)
  return backend.updateBooking(id, allowed)
}

/** Records the outcome of the notification e-mails (internal, not admin input). */
export const markNotified = backend.markNotified

export const deleteBooking = backend.deleteBooking

/* ── Accounts ─────────────────────────────────────────────────────────────
   Same two backends, same surface. See supabase/accounts.sql for the tables. */
export const createUser          = backend.createUser
export const findUserByEmail     = backend.findUserByEmail
export const findUserById        = backend.findUserById
export const updateUser          = backend.updateUser
export const listUsers           = backend.listUsers
export const deleteUser          = backend.deleteUser

export const createAuthToken     = backend.createAuthToken
export const findAuthToken       = backend.findAuthToken
export const useAuthToken        = backend.useAuthToken
export const deleteAuthTokens    = backend.deleteAuthTokens

export const addLessonEntry      = backend.addLessonEntry
export const listLessonEntries   = backend.listLessonEntries
export const lessonBalances      = backend.lessonBalances
export const deleteLessonEntry   = backend.deleteLessonEntry
export const listBookingsForUser = backend.listBookingsForUser

export const bumpRateLimit  = backend.bumpRateLimit
export const clearRateLimit = backend.clearRateLimit
