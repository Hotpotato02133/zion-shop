# Edge Functions (PayMongo)

```bash
supabase login
supabase link --project-ref <your-project-ref>

supabase secrets set PAYMONGO_SECRET_KEY=sk_test_xxx USD_TO_PHP=56
supabase functions deploy create-checkout
supabase functions deploy paymongo-webhook --no-verify-jwt
```

1. `create-checkout` verifies the caller via their Clerk JWT (Supabase third-party auth), creates a PayMongo Checkout Session
   and returns `checkoutUrl`.
2. In the PayMongo dashboard (Developers -> Webhooks) create a webhook for `checkout_session.payment.paid` pointing at
   `https://<project-ref>.supabase.co/functions/v1/paymongo-webhook`, then:
   `supabase secrets set PAYMONGO_WEBHOOK_SECRET=whsk_xxx`
3. Test with PayMongo test card `4343 4343 4343 4345` or the GCash/Maya test authorizer.
4. Go live: swap to `sk_live_` keys and disable demo payments:
   `update app_settings set value='false' where key='demo_payments';`
