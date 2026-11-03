import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'El pago con Stripe aún no está configurado.' }, { status: 503 })
  }

  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 })
  }

  let body: { itemType?: string; itemId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  if (!['course', 'product'].includes(body.itemType || '') || !body.itemId) {
    return NextResponse.json({ error: 'Artículo inválido.' }, { status: 400 })
  }

  const stripe = new Stripe(stripeSecretKey)
  const itemType = body.itemType as 'course' | 'product'

  try {
    let item: { id: string; title: string; price: number; currency: string; stripe_price_id: string | null } | null = null

    if (itemType === 'course') {
      const { data } = await supabase
        .from('courses')
        .select('id,title,price,currency,stripe_price_id,is_published')
        .eq('id', body.itemId)
        .eq('is_published', true)
        .single()
      if (data && Number(data.price) > 0) item = data
    } else {
      const { data } = await supabase
        .from('products')
        .select('id,title,price,currency,stripe_price_id,is_published')
        .eq('id', body.itemId)
        .eq('is_published', true)
        .single()
      if (data) item = data
    }

    if (!item || !item.stripe_price_id) {
      return NextResponse.json({ error: 'El artículo no está disponible para compra.' }, { status: 404 })
    }

    if (itemType === 'course') {
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', item.id)
        .maybeSingle()
      if (existing) return NextResponse.json({ error: 'Ya tienes acceso a este curso.' }, { status: 409 })
    }

    const price = await stripe.prices.retrieve(item.stripe_price_id)
    const expectedAmount = Math.round(Number(item.price) * 100)
    if (!price.active || price.unit_amount !== expectedAmount || price.currency !== item.currency.toLowerCase()) {
      return NextResponse.json({ error: 'El precio del artículo no coincide con Stripe.' }, { status: 409 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    const shippingCountries = (process.env.STRIPE_ALLOWED_SHIPPING_COUNTRIES || 'PE')
      .split(',')
      .map((country) => country.trim().toUpperCase())
      .filter((country) => /^[A-Z]{2}$/.test(country)) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection['allowed_countries']
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: price.id, quantity: 1 }],
      ...(itemType === 'product' && shippingCountries.length > 0
        ? { shipping_address_collection: { allowed_countries: shippingCountries } }
        : {}),
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        item_type: itemType,
        item_id: item.id,
      },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'No se pudo iniciar el pago.' }, { status: 500 })
  }
}
