// Creates a PayMongo hosted Checkout Session for one of the caller's unpaid orders.
// Secrets: PAYMONGO_SECRET_KEY, USD_TO_PHP (optional, default 56)
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected by Supabase.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const secret = Deno.env.get('PAYMONGO_SECRET_KEY')
    if (!secret) return json({ error: 'PayMongo is not configured' }, 503)

    const { orderId, returnUrl } = await req.json()
    if (!orderId || !returnUrl) return json({ error: 'orderId and returnUrl are required' }, 400)

    // Read the order with the caller's own token so RLS proves ownership
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: order, error } = await userClient
      .from('orders').select('*').eq('id', orderId).maybeSingle()
    if (error || !order) return json({ error: 'Order not found' }, 404)
    if (order.status !== 'to_pay') return json({ error: 'Order is not awaiting payment' }, 409)

    const rate = Number(Deno.env.get('USD_TO_PHP') ?? '56')
    const amount = Math.round(Number(order.total) * rate * 100) // centavos
    if (amount < 2000) return json({ error: 'Amount below the PayMongo minimum (PHP 20)' }, 400)

    const address = order.shipping_address ?? {}
    const res = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${secret}:`)}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: order.customer_name, email: order.customer_email, phone: address.phone },
            line_items: [{
              name: `Zion order ${order.order_number}`,
              amount,
              currency: 'PHP',
              quantity: 1,
            }],
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
            description: `Zion order ${order.order_number}`,
            reference_number: order.order_number,
            send_email_receipt: true,
            show_line_items: true,
            success_url: `${returnUrl}?payment=success`,
            cancel_url: `${returnUrl}?payment=cancelled`,
            metadata: { order_id: order.id },
          },
        },
      }),
    })
    const payload = await res.json()
    if (!res.ok) {
      console.error('PayMongo error', JSON.stringify(payload))
      return json({ error: payload?.errors?.[0]?.detail ?? 'PayMongo rejected the request' }, 502)
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await admin.from('orders').update({ payment_reference: payload.data.id }).eq('id', order.id)

    return json({ checkoutUrl: payload.data.attributes.checkout_url })
  } catch (err) {
    console.error(err)
    return json({ error: 'Unexpected error creating checkout' }, 500)
  }
})
