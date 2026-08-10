import { mailerStatus, OWNER } from '../server/lib/mailer.js'
import { adminConfigured } from '../server/lib/auth.js'

export default function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({
    ok:     true,
    resend: mailerStatus.resend,
    owner:  OWNER,
    admin:  adminConfigured,
  })
}
