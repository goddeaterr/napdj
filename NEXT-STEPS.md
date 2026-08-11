# Next steps

Agreed with the client, in priority order. Items 1–2 below were completed
(new-account notice, screen-reader announcements). These four are next.

---

## 1. Cancel / reschedule from the dashboard

**Why:** students can request a lesson but not cancel one, so every change
becomes an e-mail to the studio.

- `server/lib/accountApi.js` — add `POST /api/auth/booking-cancel { id }`.
- **The ownership check is the whole point of this task.** Load the booking,
  compare `booking.userId` with `currentUser(req).id`, and refuse otherwise.
  Without it any signed-in student can cancel any lesson by guessing an id.
- Set status to `cancelled` — do not delete. `listTakenSlots` already excludes
  cancelled rows, so the calendar slot frees itself.
- Refuse if the lesson is less than 24h away; the refunds policy already says
  cancellations need 24h notice, so the code and the policy must agree.
- Dashboard: a button on each booking whose status is `new`/`contacted`/
  `confirmed`, with a confirm step, then `refresh()`.
- Notify the owner that a booking was cancelled.

## 2. Calendar invite (.ics) on the confirmation

- Build the file by hand — no dependency needed. `BEGIN:VCALENDAR` … with
  `UID`, `DTSTAMP`, `DTSTART`, `DTEND` (start + 1h), `SUMMARY`, `LOCATION`
  (`CONTACT.address`), `DESCRIPTION`.
- Times must be UTC with a `Z` suffix. The stored date is a plain calendar date
  and the slot is a local `HH:00` in Europe/Vilnius — convert carefully, this is
  where .ics files usually go wrong.
- Skip it when `noPreference` is set: there is no time to put in the file.
- Attach via Resend's `attachments: [{ filename: 'lesson.ics', content: <base64> }]`.

## 3. Self-host the fonts

**Why:** every visitor's IP reaches Google before the first paint, which is
disclosed in the privacy and cookie policies. Self-hosting removes the
disclosure and one third-party connection.

- Fonts in use: Bebas Neue, Oswald, Barlow, Barlow Condensed, Inter.
- Put woff2 files in `public/fonts/`, declare `@font-face` with
  `font-display: swap`, drop the two `<link rel="preconnect">` and the
  stylesheet `<link>` from `index.html`, and preload Bebas Neue only.
- Then delete the Google Fonts bullet from all three languages in
  `src/legal/pages.ts` (privacy §5 and the cookie policy).

## 4. Rate limiting into Supabase

**Why:** `throttle()` in `server/lib/accountAuth.js` counts in memory. On Vercel
each instance has its own, so the sign-in and booking limits can be walked
around by getting routed to a fresh one. The per-account lockout in the `users`
table already survives — this is about the IP limits.

- Table: `rate_limits (key text primary key, count int, reset_at timestamptz)`.
- Replace the body of `throttle()` with an atomic upsert-and-increment; keep the
  same `{ allowed, retryAfterSeconds }` signature so nothing else changes.
- It becomes async — `login`, `register`, `requestPasswordReset`,
  `resendVerification` and `submitBooking` all need `await`.
- Fail open if the table is unreachable: losing rate limiting is better than
  losing sign-in.

---

## Still to do after these

Tests for the auth rules and booking-conflict logic; failure alerting;
privacy-friendly analytics.

## Waiting on the client

- Run `supabase/accounts.sql` — accounts do not work in production without it.
- Vercel env: `AUTH_SECRET`, and `FROM_EMAIL` on the verified napdj.com domain.
