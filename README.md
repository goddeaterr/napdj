# neko art platform — DJ School Website

Full-stack TypeScript + React + Vite website for a DJ school in Klaipėda,
with booking e-mails, a private reservations panel and EU legal pages.

## Quick start

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` starts both the API (port 3001) and the site (port 3000).

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type-check + production build into `dist/` |
| `npm run server` | API only |
| `npm run admin:password -- "new password"` | Prints a new `ADMIN_PASSWORD_HASH` line |

---

## 1. Where to paste links and contact details

**`src/config/site.ts` is the only file you need to edit** for anything the
visitor sees as a link or a contact:

* `CONTACT` — e-mail, phone, city, street address
* `LINKS` — Instagram, Facebook, SoundCloud, YouTube, TikTok, Mixcloud, Google Maps
* `SCHEDULE` — open days and hours (the booking calendar reads these too)
* `VENUE` — the club used for the Step 4 live performance (`Krantas A`)
* `LEGAL` — company name, company code, VAT code, registered address

> A link left as an empty string (`''`) is **hidden** on the website, so an
> unfinished profile can never show up as a dead link. Paste the real URL and it
> appears automatically.

The social block in the footer currently shows nothing because every entry in
`LINKS` is still empty — fill them in and they appear.

---

## 2. Booking e-mails

Every booking is **stored first, then e-mailed**, so nothing is lost if mail
delivery fails.

* Owner notification → `OWNER_EMAIL` (`artemijstepanov@gmail.com`)
* Student confirmation → the address from the form
* Transport: **Resend only**

Set this up in `.env`:

```
OWNER_EMAIL=artemijstepanov@gmail.com
RESEND_API_KEY=re_...
FROM_EMAIL=hello@yourdomain.lt
```

> ⚠️ **Verify a domain in Resend.** While `FROM_EMAIL` stays as the shared
> `onboarding@resend.dev`, Resend delivers **only to the address that owns the
> Resend account** — the owner notification arrives, but student confirmation
> e-mails are rejected. Add the domain at <https://resend.com/domains>, then set
> `FROM_EMAIL` to an address on it.

If Resend is unavailable the booking is still saved and visible in the admin
panel; the panel shows a warning on each affected reservation.

---

## 3. Admin panel (`/admin`)

A private page listing every reservation with name, e-mail, phone, course,
genre, requested date/time and message. It is **not linked from anywhere** on
the site, is excluded via `robots.txt` and `noindex`, and is loaded as a
separate JS chunk that public visitors never download.

Features: status workflow (new → contacted → confirmed → done / cancelled),
search, filtering, CSV export, delete.

**Security**

* Password is stored only as a scrypt hash (`ADMIN_PASSWORD_HASH`)
* Constant-time comparison, 5 login attempts per IP per 15 minutes
* Sessions are signed HMAC tokens that expire after `ADMIN_SESSION_HOURS`

**Setting the password**

```bash
npm run admin:password -- "a long password"
```

Paste the printed `ADMIN_PASSWORD_HASH=…` line into `.env`, then restart the
server. Also set `ADMIN_SECRET` to a random string, otherwise everyone is
logged out whenever the server restarts.

### Storage

The store picks its backend from the environment — nothing else in the code
changes:

| Backend | When it is used | Where the data lives |
|---|---|---|
| **Supabase** | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set | Postgres table `bookings` |
| **JSON file** | otherwise | `data/bookings.json` (`DATA_DIR` overrides) |

**Production must use Supabase.** Vercel's filesystem is temporary, so with the
file backend the reservation history disappears whenever a serverless instance
recycles. Setting it up takes a few minutes on the free tier:

1. Create a project at <https://supabase.com>
2. SQL Editor → New query → paste and run [`supabase/schema.sql`](supabase/schema.sql)
3. Project Settings → API → copy **Project URL** and the **service_role** secret
4. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env` and to the
   Vercel project's environment variables, then redeploy

The table has row level security enabled with no policies, so the anon key can
read nothing — only the server's service_role key has access. Keep that key out
of the frontend and out of git.

The `data/` folder is gitignored because it contains personal data.

---

## 4. Legal pages

Reachable at `/privacy`, `/terms`, `/cookies` and `/refunds`, in English,
Russian and Lithuanian, and linked from the footer. These paths — and `/admin` —
need the host to fall back to `index.html` for unknown URLs; `vercel.json`
already does this, and any other host needs the same single-page-app rewrite. The booking form requires
an explicit consent checkbox before it can be submitted.

**Before publishing, fill in `LEGAL` in `src/config/site.ts`** — the registered
company name, company code, VAT code and address appear on every legal page and
are required for a business site in the EU. If the business is not registered as
a company yet, leave those fields empty and the pages fall back to the brand
name and city.

Two things worth knowing:

* Fonts load from Google Fonts, which sends the visitor's IP to Google. This is
  disclosed in the privacy and cookie policies. Self-hosting the fonts removes
  the issue entirely.
* No analytics, advertising or tracking cookies are used, which is why the site
  needs no cookie consent banner.

---

## Environment variables

See `.env.example` for the complete, commented list.

| Variable | Purpose |
|---|---|
| `OWNER_EMAIL` | Who receives booking notifications |
| `RESEND_API_KEY` | Resend API key |
| `FROM_EMAIL` | Sender address (must be on a verified Resend domain) |
| `ADMIN_PASSWORD_HASH` | scrypt hash of the admin password |
| `ADMIN_SECRET` | Signs admin session tokens |
| `ADMIN_SESSION_HOURS` | Login lifetime (default 8) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Persistent booking storage (required in production) |
| `DATA_DIR` | Where `bookings.json` is written when Supabase is not configured |
| `PUBLIC_PHONE`, `PUBLIC_SITE_URL`, `BRAND_NAME` | Shown in e-mails |
| `API_PORT` | Local API port (default 3001) |

---

## Project structure

```
├── api/                      # Vercel serverless functions
│   ├── send-booking.js
│   └── admin/{login,bookings}.js
├── server/
│   ├── index.js              # Express API (local + self-hosted)
│   └── lib/
│       ├── booking.js        # validate → store → notify
│       ├── store.js          # JSON booking store
│       ├── mailer.js         # Resend + e-mail templates
│       ├── auth.js           # password hashing, tokens, rate limiting
│       └── adminApi.js       # shared admin handlers
├── scripts/hash-password.mjs
└── src/
    ├── config/site.ts        # ← links, contacts, hours, legal details
    ├── legal/                # legal page content (EN/RU/LT) + view
    ├── admin/                # hidden reservations panel
    ├── lib/{i18n,LangContext,router,audio,scroll}.ts
    ├── components/           # site sections
    └── styles/global.css     # monochrome design system
```

## Design system

Black & white only. Tokens live in `src/styles/global.css`:

| Token | Value | Use |
|---|---|---|
| `--black` | `#0A0A0A` | Page background |
| `--white` / `--accent` | `#FFFFFF` | Text, primary accent |
| `--accent-lo` | `#8C8C8C` | Muted accent |
| `--tone-1` / `--tone-2` / `--tone-3` | `#E0E0E0` / `#D2D2D2` / `#C8C8C8` | Secondary greys |

Display font Bebas Neue, body Barlow, Oswald/Inter for Cyrillic.
