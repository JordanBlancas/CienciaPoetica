-- Run once in the Supabase SQL editor to enable Stripe, media and merch.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS public.media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  youtube_url TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'podcast')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_price_id TEXT UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  amount_total INTEGER NOT NULL CHECK (amount_total >= 0),
  currency TEXT NOT NULL,
  shipping_details JSONB,
  status TEXT NOT NULL CHECK (status IN ('paid', 'fulfilled', 'refunded')) DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published media" ON public.media_items;
CREATE POLICY "Anyone can view published media" ON public.media_items
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can view published products" ON public.products;
CREATE POLICY "Anyone can view published products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Users can create own enrollments" ON public.enrollments;
CREATE POLICY "Users can create own enrollments" ON public.enrollments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_id
        AND courses.is_published = true
        AND courses.price = 0
    )
  );

DROP POLICY IF EXISTS "Users can view own product orders" ON public.purchase_orders;
CREATE POLICY "Users can view own product orders" ON public.purchase_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Writes are performed only by the verified Stripe webhook using the service role key.
REVOKE INSERT, UPDATE, DELETE ON public.purchase_orders FROM anon, authenticated;
