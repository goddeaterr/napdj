import { mailerStatus, OWNER } from '../server/lib/mailer.js'
import { adminConfigured } from '../server/lib/auth.js'
import { storeName, storeIsPersistent } from '../server/lib/store.js'

export default function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')
  res.json({
    ok:         true,
    resend:     mailerStatus.resend,
    owner:      OWNER,
    admin:      adminConfigured,
    store:      storeName,
    persistent: storeIsPersistent,
  })
}
