// PayMongo webhook: marks the order paid on `checkout_session.payment.paid`.
// Deploy with --no-verify-jwt. Secrets: PAYMONGO_WEBHOOK_SECRET
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

async function validSignature(header: string | null, raw: string, secret: string) {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${raw}`)))
  // `te` is the test-mode signature, `li` the live-mode one
  return expected === parts.te || expected === parts.li
}

Deno.serve(async (req) => {
  const raw = await req.text()
  const secret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET')
  if (!secret || !(await validSignature(req.headers.get('Paymongo-Signature'), raw, secret))) {
    return new Response('invalid signature', { status: 401 })
  }

  const event = JSON.parse(raw)?.data?.attributes
  if (event?.type !== 'checkout_session.payment.paid') return new Response('ignored', { status: 200 })

  const session = event.data
  const orderId = session?.attributes?.metadata?.order_id
  const paymentId = session?.attributes?.payments?.[0]?.id ?? session?.id
  if (!orderId) return new Response('no order id', { status: 200 })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { error } = await admin.rpc('mark_order_paid', { p_order_id: orderId, p_reference: paymentId })
  if (error) {
    console.error(error)
    return new Response('failed', { status: 500 }) // PayMongo retries
  }
  return new Response('ok', { status: 200 })
})
