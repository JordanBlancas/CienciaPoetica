import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const signature = request.headers.get('stripe-signature')

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'El webhook no está configurado.' }, { status: 503 })
  }
  if (!signature) return NextResponse.json({ error: 'Falta la firma de Stripe.' }, { status: 400 })

  const stripe = new Stripe(stripeSecretKey)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch (error) {
    console.error('Invalid Stripe webhook signature:', error)
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 400 })
  }

  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  if (session.payment_status !== 'paid' || !session.id) {
    return NextResponse.json({ received: true })
  }

  const userId = session.metadata?.user_id
  const itemType = session.metadata?.item_type
  const itemId = session.metadata?.item_id
  if (!userId || !itemId || !['course', 'product'].includes(itemType || '')) {
    return NextResponse.json({ error: 'Metadatos de compra incompletos.' }, { status: 400 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (itemType === 'course') {
    const { error } = await admin.from('enrollments').upsert(
      { user_id: userId, course_id: itemId, progress: 0 },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true }
    )
    if (error) {
      console.error('Could not grant paid course enrollment:', error)
      return NextResponse.json({ error: 'No se pudo registrar el acceso.' }, { status: 500 })
    }
  } else {
    const { error } = await admin.from('purchase_orders').upsert(
      {
        user_id: userId,
        product_id: itemId,
        stripe_checkout_session_id: session.id,
        amount_total: session.amount_total || 0,
        currency: (session.currency || 'usd').toUpperCase(),
        shipping_details: session.collected_information?.shipping_details || null,
        status: 'paid',
      },
      { onConflict: 'stripe_checkout_session_id', ignoreDuplicates: true }
    )
    if (error) {
      console.error('Could not record product order:', error)
      return NextResponse.json({ error: 'No se pudo registrar el pedido.' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
