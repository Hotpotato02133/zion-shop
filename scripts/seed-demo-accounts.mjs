// Creates (or reuses) the demo customer + demo admin.
//   1. Clerk users (email pre-verified, via the Clerk Backend API)
//   2. public.profiles rows for both
//   3. public.admins row for the admin  -> is_admin() becomes true for that Clerk user
// Safe to re-run. Requires in .env.local (or the shell):
//   CLERK_SECRET_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { readFileSync, existsSync } from 'node:fs'
import { DEMO_ACCOUNTS } from '../src/lib/demoAccounts.js'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}

const { CLERK_SECRET_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
const missing = ['CLERK_SECRET_KEY', 'VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing env: ${missing.join(', ')}\nAdd them to .env.local (never commit them) and re-run.`)
  process.exit(1)
}

const clerk = async (path, init = {}) => {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json', ...init.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Clerk ${path} -> ${res.status} ${JSON.stringify(body.errors || body)}`)
  return body
}

const rest = async (table, rows, onConflict) => {
  const res = await fetch(`${VITE_SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`Supabase ${table} -> ${res.status} ${await res.text()}`)
}

const ensureClerkUser = async (acct) => {
  const found = await clerk(`/users?email_address=${encodeURIComponent(acct.email)}`)
  if (found.length) {
    // Re-assert the password so the public credentials always work.
    await clerk(`/users/${found[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ password: acct.password, skip_password_checks: true }),
    })
    return found[0].id
  }
  const user = await clerk('/users', {
    method: 'POST',
    body: JSON.stringify({
      email_address: [acct.email],
      password: acct.password,
      first_name: acct.firstName,
      last_name: acct.lastName,
      skip_password_checks: true,
    }),
  })
  return user.id
}

const ids = {}
for (const acct of Object.values(DEMO_ACCOUNTS)) {
  ids[acct.role] = await ensureClerkUser(acct)
  console.log(`Clerk  ${acct.role.padEnd(8)} ${acct.email} -> ${ids[acct.role]}`)
}

await rest(
  'profiles',
  Object.values(DEMO_ACCOUNTS).map((a) => ({
    id: ids[a.role],
    email: a.email,
    full_name: `${a.firstName} ${a.lastName}`,
  })),
  'id',
)
await rest('admins', [{ user_id: ids.admin, email: DEMO_ACCOUNTS.admin.email }], 'user_id')
console.log('Supabase profiles + admins row upserted. Done.')
