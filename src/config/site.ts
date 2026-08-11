/* ============================================================================
   SITE CONFIG — EDIT THIS FILE, NOTHING ELSE
   ----------------------------------------------------------------------------
   Every phone number, e-mail, social link, opening hour and legal detail used
   anywhere on the website is read from this one file.

   HOW TO MAKE THE LINKS WORK:
   Paste the real URL between the quotes, e.g.
       instagram: 'https://www.instagram.com/your.real.page',
   An entry left as an empty string ('') is simply NOT shown on the website —
   so an empty link can never look broken to a visitor. Fill in what exists,
   leave the rest empty.

   After editing, run `npm run build` (or restart `npm run dev`).
============================================================================ */

/* ── Contact details ─────────────────────────────────────────────────────── */
export const CONTACT = {
  /** Main inbox. Booking notifications are also sent here (see .env). */
  email: 'artemijstepanov@gmail.com',

  /** Shown on the site. Keep international format. */
  phone: '+370 624 50896',
  /** Same number, no spaces — used for tel: links. */
  phoneHref: '+37062450896',

  city: 'Klaipėda',
  country: 'Lithuania',

  /** Studio street address — where students actually come. */
  address: 'Naujojo Uosto g. 3',
} as const

/* ── External links ──────────────────────────────────────────────────────────
   PASTE THE REAL URLs HERE. Empty ('') = hidden on the website.            */
export const LINKS = {
  instagram:  '',   // e.g. 'https://www.instagram.com/nekoartplatform'
  facebook:   '',   // e.g. 'https://www.facebook.com/nekoartplatform'
  soundcloud: '',   // e.g. 'https://soundcloud.com/nekoartplatform'
  youtube:    '',   // e.g. 'https://www.youtube.com/@nekoartplatform'
  tiktok:     '',   // e.g. 'https://www.tiktok.com/@nekoartplatform'
  mixcloud:   '',   // e.g. 'https://www.mixcloud.com/nekoartplatform'
  /** Google Maps link to the studio — shown on the address line. */
  googleMaps: '',   // e.g. 'https://maps.app.goo.gl/xxxxxxxx'
} as const

/** Labels + order for the social block in the footer. */
const SOCIAL_ORDER: { key: keyof typeof LINKS; label: string }[] = [
  { key: 'instagram',  label: 'Instagram'  },
  { key: 'facebook',   label: 'Facebook'   },
  { key: 'soundcloud', label: 'SoundCloud' },
  { key: 'youtube',    label: 'YouTube'    },
  { key: 'tiktok',     label: 'TikTok'     },
  { key: 'mixcloud',   label: 'Mixcloud'   },
]

/** Only the links that actually have a URL — never renders a dead link. */
export function socialLinks() {
  return SOCIAL_ORDER
    .filter(s => LINKS[s.key].trim() !== '')
    .map(s => ({ label: s.label, url: LINKS[s.key] }))
}

/* ── Opening hours ───────────────────────────────────────────────────────────
   The booking calendar reads these too: only the days listed in `openDays`
   can be selected, and time slots run from `openHour` to `closeHour`.      */
export const SCHEDULE = {
  /** 1 = Monday … 5 = Friday. Studio works Mon–Fri. */
  openDays: [1, 2, 3, 4, 5],
  openHour: 10,
  closeHour: 20,
} as const

export const HOURS_LABEL = `${String(SCHEDULE.openHour).padStart(2, '0')}:00–${String(SCHEDULE.closeHour).padStart(2, '0')}:00`

/* ── Venue used for live performances (Step 4) ───────────────────────────── */
export const VENUE = {
  name: 'Krantas A',
  city: 'Klaipėda',
} as const

/* ── Legal details ───────────────────────────────────────────────────────────
   Required on the legal pages for the site to be publishable in the EU.
   Fill these in with the real registration data of the business.          */
export const LEGAL = {
  /** Trading name shown across the site. */
  brand: 'neko art platform',
  /** Registered legal name. VšĮ = viešoji įstaiga, a public establishment. */
  companyName: 'Neko muzika, VšĮ',
  /** Lithuanian company code (įmonės kodas). */
  companyCode: '305718580',
  /** VAT code (PVM kodas). Empty — the company is not VAT registered. */
  vatCode: '',
  /**
   * Registered office as filed with the register. This is the legal address
   * for notices, not somewhere students should turn up — keep the studio's
   * visiting address in CONTACT.address if it is different.
   */
  registeredAddress: 'Minijos g. 130A-57, Klaipėda, Lietuva',
  /** Director as filed with the register — the entity's legal representative. */
  director: 'Alika Kitaigorodskaja',
  /** Date the legal entity was registered. */
  registeredOn: '2021-03-19',
  /** Person responsible for data protection questions. */
  dataContactEmail: 'artemijstepanov@gmail.com',
  /** Date the legal documents were last updated (shown on each page). */
  lastUpdated: '2026-08-11',
} as const

export const SITE_URL = 'https://napdj.com'
