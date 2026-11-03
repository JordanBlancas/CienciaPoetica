'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, BookOpen, Clapperboard, GraduationCap, Mic2, ShoppingBag, X } from 'lucide-react'
import { Course, supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'

type SectionKey = 'courses' | 'videos' | 'podcast' | 'store'
type MediaItem = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  youtube_url: string | null
  media_type: 'video' | 'podcast'
}
type Product = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  price: number
  currency: string
  stripe_price_id: string | null
}
type SelectedItem = Course | MediaItem | Product

const sections: { key: SectionKey; title: string; description: string; icon: typeof BookOpen; tint: string }[] = [
  { key: 'courses', title: 'Cursos', description: 'Aprende matemáticas e ingeniería con cursos propios.', icon: GraduationCap, tint: 'from-cyan-100/85 to-white/40' },
  { key: 'videos', title: 'Videos', description: 'Clases breves, ideas y noticias de ciencia y tecnología.', icon: Clapperboard, tint: 'from-sky-100/85 to-white/40' },
  { key: 'podcast', title: 'Podcast', description: 'Conversaciones con las personas detrás de las ideas.', icon: Mic2, tint: 'from-rose-100/75 to-white/40' },
  { key: 'store', title: 'Tienda', description: 'Objetos para llevar la curiosidad al día a día.', icon: ShoppingBag, tint: 'from-amber-100/75 to-white/40' },
]

function isMediaItem(item: SelectedItem): item is MediaItem {
  return 'media_type' in item
}

function isProduct(item: SelectedItem): item is Product {
  return 'price' in item && 'currency' in item && !('instructor_id' in item)
}

function isCourseItem(item: SelectedItem): item is Course {
  return 'instructor_id' in item
}

function youtubeEmbedUrl(url: string | null) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    let id = ''
    if (parsed.hostname === 'youtu.be') id = parsed.pathname.slice(1)
    if (parsed.hostname.endsWith('youtube.com')) {
      id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).at(-1) || ''
    }
    if (!/^[\w-]{11}$/.test(id)) return null
    return `https://www.youtube-nocookie.com/embed/${id}`
  } catch {
    return null
  }
}

function formatPrice(price: number, currency = 'USD') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: currency.toUpperCase() }).format(price)
}

export default function Storefront() {
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null)
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!activeSection) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveSection(null)
        setSelectedItem(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeSection])

  useEffect(() => {
    if (!activeSection) return
    let cancelled = false

    const loadSection = async () => {
      setLoading(true)
      setMessage('')
      setSelectedItem(null)

      try {
        if (activeSection === 'courses') {
          const { data, error } = await supabase.from('courses').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(10)
          if (error) throw error
          if (!cancelled) setCourses(data || [])
        } else if (activeSection === 'videos' || activeSection === 'podcast') {
          const { data, error } = await supabase.from('media_items').select('id,title,description,image_url,youtube_url,media_type').eq('is_published', true).eq('media_type', activeSection === 'videos' ? 'video' : 'podcast').order('published_at', { ascending: false }).limit(20)
          if (error) throw error
          if (!cancelled) setMedia((data || []) as MediaItem[])
        } else {
          const { data, error } = await supabase.from('products').select('id,title,description,image_url,price,currency,stripe_price_id').eq('is_published', true).order('created_at', { ascending: false }).limit(20)
          if (error) throw error
          if (!cancelled) setProducts((data || []) as Product[])
        }
      } catch (error) {
        console.error('Error loading storefront section:', error)
        if (!cancelled) setMessage('No se pudo cargar el contenido. Comprueba la conexión e inténtalo de nuevo.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSection()
    return () => { cancelled = true }
  }, [activeSection])

  const closeSection = () => {
    setActiveSection(null)
    setSelectedItem(null)
    setMessage('')
  }

  const startCheckout = async (itemType: 'course' | 'product', itemId: string) => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId }),
      })
      const result = await response.json()
      if (!response.ok || typeof result.url !== 'string') throw new Error(result.error || 'No se pudo iniciar el pago.')
      window.location.assign(result.url)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar el pago.')
      setBusy(false)
    }
  }

  const enrollFreeCourse = async (course: Course) => {
    setBusy(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.assign('/auth/login?redirectTo=/dashboard/courses')
        return
      }

      const { error } = await supabase.from('enrollments').upsert(
        { user_id: user.id, course_id: course.id, progress: 0 },
        { onConflict: 'user_id,course_id', ignoreDuplicates: true }
      )
      if (error) throw error
      setMessage('Ya tienes acceso al curso. Lo encontrarás en Mi Panel.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la inscripción.')
    } finally {
      setBusy(false)
    }
  }

  const active = sections.find((section) => section.key === activeSection)
  const selectedCourse = selectedItem && isCourseItem(selectedItem) ? selectedItem : null
  const selectedProduct = selectedItem && isProduct(selectedItem) ? selectedItem : null
  const selectedMedia = selectedItem && isMediaItem(selectedItem) ? selectedItem : null
  const selectedImage = selectedItem && 'image_url' in selectedItem ? selectedItem.image_url : null

  return (
    <div id="inicio" className="glass-page min-h-screen overflow-hidden text-slate-900">
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-10">
        <section className="grid items-center gap-5 py-5 sm:gap-8 md:min-h-[420px] md:grid-cols-[1.05fr_0.95fr] md:py-8">
          <div className="relative z-[1] max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--evergreen)] sm:text-sm">Matemáticas · Ingeniería · Imaginación</p>
            <h1 className="max-w-[12ch] font-serif text-[2.8rem] font-medium leading-[0.98] tracking-normal text-[#17212b] sm:text-6xl md:text-7xl">Ciencia <span className="italic text-[var(--evergreen)]">Poética</span></h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
              Ciencia y matemáticas como formas de expresión. Un lugar para aprender, escuchar ideas y llevar la curiosidad a la vida diaria.
            </p>
            <p className="mt-4 font-serif text-lg italic text-slate-500">Por siempre Ada.</p>
          </div>
          <figure className="relative mx-auto aspect-[16/10] w-full max-w-[560px] overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/30 shadow-[0_35px_80px_-48px_rgba(27,43,61,0.65)] backdrop-blur-xl md:aspect-[5/4] md:ml-auto">
            <Image src="/images/ada-lovelace.png" alt="Retrato de Ada Lovelace por Margaret Sarah Carpenter, 1836" fill priority sizes="(max-width: 768px) 100vw, 46vw" className="object-cover object-[50%_25%]" />
            <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/68 px-4 py-3 text-xs text-slate-700 shadow-xl backdrop-blur-2xl sm:inset-x-5 sm:bottom-5">
              <span><strong className="block text-sm">Ada Lovelace</strong>Margaret Sarah Carpenter · 1836</span>
              <a href="https://commons.wikimedia.org/wiki/File:Carpenter_portrait_of_Ada_Lovelace_-_detail.png" target="_blank" rel="noreferrer" className="shrink-0 underline decoration-emerald-800/30 underline-offset-4">Dominio público</a>
            </figcaption>
          </figure>
        </section>

        <section aria-label="Explora Ciencia Poética" className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4">
          {sections.map(({ key, title, description, icon: Icon, tint }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`group glass-panel flex min-h-36 flex-col items-start rounded-2xl bg-gradient-to-br ${tint} p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_-34px_rgba(27,43,61,0.5)] focus:outline-none focus:ring-4 focus:ring-emerald-700/15 sm:min-h-40 sm:p-5`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/80 bg-white/65 text-[var(--evergreen)] shadow-sm backdrop-blur-xl">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="mt-4 flex w-full items-center justify-between gap-2 font-serif text-xl font-semibold text-slate-800 sm:text-2xl">
                {title}<ArrowRightIcon />
              </span>
              <span className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">{description}</span>
            </button>
          ))}
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">Cursos selectos · Videos · Podcast · Objetos de Ciencia Poética</p>
      </main>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-3 backdrop-blur-md sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSection() }}>
          <section role="dialog" aria-modal="true" aria-labelledby="section-dialog-title" className="glass-panel-strong flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] sm:max-h-[calc(100dvh-3rem)]">
            <header className="flex items-center justify-between border-b border-white/70 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                {selectedItem && <button type="button" onClick={() => { setSelectedItem(null); setMessage('') }} aria-label="Volver al listado" className="rounded-full p-2 text-slate-600 hover:bg-white/70">←</button>}
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--evergreen)]">Ciencia Poética</p>
                  <h2 id="section-dialog-title" className="truncate font-serif text-xl font-semibold tracking-normal text-slate-900 sm:text-2xl">{selectedItem ? selectedItem.title : active.title}</h2>
                </div>
              </div>
              <button type="button" onClick={closeSection} aria-label="Cerrar ventana" className="ml-3 rounded-full border border-white/80 bg-white/70 p-2 text-slate-600 shadow-sm transition hover:bg-white">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="overflow-y-auto p-4 sm:p-6">
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-2xl bg-white/65" /><div className="h-36 animate-pulse rounded-2xl bg-white/65" /></div>
              ) : selectedItem ? (
                <div className="grid gap-5 md:grid-cols-[1fr_0.9fr] md:items-start">
                  <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/55">
                    {selectedMedia && youtubeEmbedUrl(selectedMedia.youtube_url) ? (
                      <div className="aspect-video"><iframe src={youtubeEmbedUrl(selectedMedia.youtube_url) || undefined} title={selectedMedia.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full" /></div>
                    ) : selectedImage ? (
                      <img src={selectedImage} alt={selectedItem.title} className="aspect-[4/3] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center text-[var(--evergreen)]"><BookOpen className="h-12 w-12" strokeWidth={1.2} /></div>
                    )}
                  </div>
                  <div>
                    {selectedCourse && <p className="text-xl font-semibold text-[var(--evergreen)]">{formatPrice(selectedCourse.price, selectedCourse.currency || 'USD')}</p>}
                    {selectedProduct && <p className="text-xl font-semibold text-[var(--evergreen)]">{formatPrice(selectedProduct.price, selectedProduct.currency)}</p>}
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{selectedItem.description || 'Más información próximamente.'}</p>
                    {selectedMedia && selectedMedia.youtube_url && !youtubeEmbedUrl(selectedMedia.youtube_url) && <a href={selectedMedia.youtube_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--evergreen)] px-4 py-2.5 text-sm font-semibold text-white">Ver en YouTube <ArrowRight className="h-4 w-4" /></a>}
                    {selectedCourse && (selectedCourse.price > 0 ? (
                      <button type="button" disabled={busy || !('stripe_price_id' in selectedCourse) || !selectedCourse.stripe_price_id} onClick={() => startCheckout('course', selectedCourse.id)} className="mt-5 min-h-11 w-full rounded-full bg-[var(--evergreen)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#285d58] disabled:cursor-not-allowed disabled:opacity-50">
                        {busy ? 'Abriendo Stripe…' : selectedCourse.stripe_price_id ? 'Comprar curso con Stripe' : 'Pago en preparación'}
                      </button>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => enrollFreeCourse(selectedCourse)} className="mt-5 min-h-11 w-full rounded-full bg-[var(--evergreen)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#285d58] disabled:opacity-50">{busy ? 'Procesando…' : 'Inscribirme gratis'}</button>
                    ))}
                    {selectedProduct && <button type="button" disabled={busy || !selectedProduct.stripe_price_id} onClick={() => startCheckout('product', selectedProduct.id)} className="mt-5 min-h-11 w-full rounded-full bg-[var(--evergreen)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#285d58] disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Abriendo Stripe…' : selectedProduct.stripe_price_id ? 'Comprar con Stripe' : 'Disponible próximamente'}</button>}
                    {message && <p role="status" className="mt-4 rounded-xl border border-white/80 bg-white/70 p-3 text-sm leading-5 text-slate-700">{message}</p>}
                  </div>
                </div>
              ) : (
                <>
                  {message && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">{message}</p>}
                  {activeSection === 'courses' && <ItemGrid items={courses} empty="Los cursos aparecerán aquí cuando estén publicados." onSelect={setSelectedItem} type="course" />}
                  {(activeSection === 'videos' || activeSection === 'podcast') && <ItemGrid items={media} empty={activeSection === 'videos' ? 'Los videos y noticias aparecerán aquí cuando haya contenido publicado.' : 'Las primeras conversaciones aparecerán aquí cuando se publique un episodio.'} onSelect={setSelectedItem} type="media" />}
                  {activeSection === 'store' && <ItemGrid items={products} empty="La primera colección de tazas, polos y objetos de Ciencia Poética está en preparación." onSelect={setSelectedItem} type="product" />}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function ArrowRightIcon() {
  return <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[var(--evergreen)]" />
}

function ItemGrid({ items, empty, onSelect, type }: { items: SelectedItem[]; empty: string; onSelect: (item: SelectedItem) => void; type: 'course' | 'media' | 'product' }) {
  if (items.length === 0) return <p className="rounded-2xl border border-white/75 bg-white/50 px-5 py-10 text-center text-sm text-slate-600">{empty}</p>

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const product = isProduct(item) ? item : null
        const course = type === 'course' ? item as Course : null
        const image = 'image_url' in item ? item.image_url : null
        const price = course ? formatPrice(course.price, 'USD') : product ? formatPrice(product.price, product.currency) : null
        return (
          <button key={item.id} type="button" onClick={() => onSelect(item)} className="group overflow-hidden rounded-2xl border border-white/80 bg-white/62 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-700/15">
            <div className="relative aspect-[16/10] bg-gradient-to-br from-cyan-100/80 via-white/50 to-rose-100/70">
              {image ? <img src={image} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[var(--evergreen)]/55">{type === 'course' ? <GraduationCap className="h-9 w-9" /> : type === 'product' ? <ShoppingBag className="h-9 w-9" /> : <Clapperboard className="h-9 w-9" />}</div>}
            </div>
            <span className="flex items-start justify-between gap-3 p-4">
              <span className="min-w-0"><span className="block line-clamp-2 font-serif text-lg font-semibold text-slate-800">{item.title}</span>{price && <span className="mt-2 block text-sm font-semibold text-[var(--evergreen)]">{price}</span>}</span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[var(--evergreen)]" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
