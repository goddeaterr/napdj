/* Generates the value for ADMIN_PASSWORD_HASH.
   Usage:  npm run admin:password -- "your new password"            */
import { hashPassword } from '../server/lib/auth.js'

const password = process.argv[2]

if (!password) {
  console.error('Usage: npm run admin:password -- "your password"')
  process.exit(1)
}

if (password.length < 10) {
  console.error('Please choose a password of at least 10 characters.')
  process.exit(1)
}

console.log('\nAdd this line to your .env file:\n')
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}\n`)
