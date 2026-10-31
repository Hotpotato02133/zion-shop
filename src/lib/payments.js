// PayMongo hosted checkout, via the `create-checkout` Supabase Edge Function.

const readFunctionError = async (error) => {
  try {
    const body = await error.context?.json?.()
    if (body?.error) return body.error
  } catch {
    // fall through
  }
  return error?.message || 'Payment service is unavailable'
}

/** Redirects the browser to PayMongo. Throws if the function is not deployed/configured. */
export const startPayment = async (supabase, order) => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { orderId: order.id, returnUrl: `${window.location.origin}/orders/${order.id}` }
  })
  if (error) throw new Error(await readFunctionError(error))
  if (!data?.checkoutUrl) throw new Error('Payment service did not return a checkout link')
  window.location.assign(data.checkoutUrl)
}

/** True while the store runs in demo mode (see app_settings.demo_payments). */
export const fetchDemoPaymentsEnabled = async (supabase) => {
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'demo_payments').maybeSingle()
  return data?.value === 'true'
}
