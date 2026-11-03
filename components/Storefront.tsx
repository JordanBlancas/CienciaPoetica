'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Brain, BookOpen, Clapperboard, Facebook, Github, Globe2, GraduationCap, Instagram, Linkedin, Mic2, Music2, ShoppingBag, X, X as XBrand } from 'lucide-react'
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
    if (!selectedItem) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedItem(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectedItem])

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
        <section className="pt-6 sm:pt-8">
          <p className="mb-4 whitespace-nowrap text-[10px] font-semibold uppercase leading-none tracking-[0.04em] text-[var(--evergreen)] sm:text-sm sm:tracking-[0.12em]">Matemáticas · Ciencia · Tecnología · Ingeniería</p>
          <div aria-label="Explora Ciencia Poética" className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {sections.map(({ key, title, icon: Icon, tint }) => (
              <button
                key={key}
                type="button"
                aria-pressed={activeSection === key}
                onClick={() => {
                  setSelectedItem(null)
                  setActiveSection(activeSection === key ? null : key)
                }}
                className={`group glass-panel flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-br ${tint} px-3 py-2 text-left transition hover:-translate-y-0.5 hover:bg-white/85 focus:outline-none focus:ring-4 focus:ring-emerald-700/15 sm:min-h-14 sm:justify-center sm:px-4 ${activeSection === key ? 'ring-2 ring-emerald-700/35' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0 text-[var(--evergreen)]" strokeWidth={1.9} />
                <span className="text-xs font-semibold text-slate-700 sm:text-sm">{title}</span>
              </button>
            ))}
          </div>
        </section>

        {active && (
          <section aria-labelledby="collection-title" className="mt-5 scroll-mt-24 rounded-2xl border border-white/75 bg-white/35 p-4 shadow-[0_20px_55px_-42px_rgba(27,43,61,0.55)] backdrop-blur-xl sm:mt-6 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="collection-title" className="font-serif text-2xl font-semibold tracking-normal text-slate-800">{active.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{active.description}</p>
              </div>
              <button type="button" onClick={closeSection} className="rounded-full px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white/70 hover:text-slate-900">Cerrar sección</button>
            </div>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2"><div className="h-28 animate-pulse rounded-xl bg-white/60" /><div className="h-28 animate-pulse rounded-xl bg-white/60" /></div>
            ) : message ? (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">{message}</p>
            ) : (
              <InlineItemGrid
                items={activeSection === 'courses' ? courses : activeSection === 'store' ? products : media}
                empty={activeSection === 'courses' ? 'Los cursos aparecerán aquí cuando estén publicados.' : activeSection === 'videos' ? 'Los videos y noticias aparecerán aquí cuando haya contenido publicado.' : activeSection === 'podcast' ? 'Las primeras conversaciones aparecerán aquí cuando se publique un episodio.' : 'La primera colección de tazas, polos y objetos de Ciencia Poética está en preparación.'}
                onSelect={setSelectedItem}
                type={activeSection === 'courses' ? 'course' : activeSection === 'store' ? 'product' : 'media'}
              />
            )}
          </section>
        )}

        <section className="relative isolate my-6 overflow-hidden py-10 sm:my-10 sm:py-14 md:my-14 md:min-h-[440px] md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 top-1/2 h-[112%] w-[94%] -translate-y-1/2 opacity-35 sm:right-[-8%] sm:w-[76%] sm:opacity-45 md:right-[-2%] md:h-[132%] md:w-[58%] md:opacity-60"
            style={{
              maskImage: 'radial-gradient(ellipse at 58% 46%, #000 24%, rgba(0,0,0,.86) 44%, rgba(0,0,0,.48) 61%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 58% 46%, #000 24%, rgba(0,0,0,.86) 44%, rgba(0,0,0,.48) 61%, transparent 80%)',
            }}
          >
            <Image
              src="/images/ada-lovelace.png"
              alt=""
              fill
              sizes="(max-width: 768px) 90vw, 58vw"
              className="object-cover object-[50%_25%]"
            />
          </div>
          <p className="sr-only">Retrato de Ada Lovelace pintado por Margaret Sarah Carpenter en 1836. La obra es de dominio público.</p>
          <div className="relative z-10 max-w-2xl">
            <h1 className="max-w-[12ch] font-serif text-[2.8rem] font-medium leading-[0.98] tracking-normal text-[#17212b] sm:text-6xl md:text-7xl">Ciencia <span className="italic text-[var(--evergreen)]">Poética</span></h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
              Ciencia y matemáticas como formas de expresión. Un lugar para aprender, escuchar ideas y llevar la curiosidad a la vida diaria.
            </p>
            <p className="mt-4 font-serif text-lg italic text-slate-500">Por siempre Ada.</p>
          </div>
        </section>

        <section className="grid gap-5 border-t border-slate-300/55 py-8 sm:py-10 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-7">
          <div className="flex items-center gap-4">
            <Image
              src="/images/jordan-blancas.jpg"
              alt="Jordan Blancas"
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 rounded-full border border-white/85 object-cover shadow-[0_12px_30px_-18px_rgba(27,43,61,0.55)] sm:h-[4.5rem] sm:w-[4.5rem]"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--evergreen)]">Sobre el autor</p>
              <h2 className="mt-1 font-serif text-xl font-semibold tracking-normal text-slate-800 sm:text-2xl">Jordan Blancas</h2>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Como ingeniero y docente universitario, mantienes una búsqueda constante del conocimiento y exploras los vínculos entre las matemáticas, la ciencia, la tecnología, la ingeniería y la creatividad. En Ciencia Poética compartes esas conexiones a través de cursos, conversaciones y proyectos.
          </p>
          <nav aria-label="Redes sociales de Jordan Blancas" className="flex flex-wrap gap-2 md:justify-end">
            <SocialLink href="https://www.facebook.com/jordanblancas" label="Facebook"><Facebook /></SocialLink>
            <SocialLink href="https://www.instagram.com/jordanblancas" label="Instagram"><Instagram /></SocialLink>
            <SocialLink href="https://pe.linkedin.com/in/jordanblancas" label="LinkedIn"><Linkedin /></SocialLink>
            <SocialLink href="https://jordanblancas.com" label="Sitio web"><Globe2 /></SocialLink>
            <SocialLink href="https://polimatas.club/jordanblancas" label="Polímatas Club"><Brain /></SocialLink>
            <SocialLink href="https://github.com/JordanBlancas" label="GitHub"><Github /></SocialLink>
            <SocialLink href="https://x.com/jordanblancas" label="X"><XBrand /></SocialLink>
            <SocialLink href="https://www.tiktok.com/@jordan.blancas" label="TikTok"><Music2 /></SocialLink>
          </nav>
        </section>

      </main>

      {active && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-3 backdrop-blur-md sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedItem(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="section-dialog-title" className="glass-panel-strong flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] sm:max-h-[calc(100dvh-3rem)]">
            <header className="flex items-center justify-between border-b border-white/70 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => { setSelectedItem(null); setMessage('') }} aria-label="Volver al listado" className="rounded-full p-2 text-slate-600 hover:bg-white/70">←</button>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--evergreen)]">Ciencia Poética</p>
                  <h2 id="section-dialog-title" className="truncate font-serif text-xl font-semibold tracking-normal text-slate-900 sm:text-2xl">{selectedItem ? selectedItem.title : active.title}</h2>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedItem(null)} aria-label="Cerrar ventana" className="ml-3 rounded-full border border-white/80 bg-white/70 p-2 text-slate-600 shadow-sm transition hover:bg-white">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="overflow-y-auto p-4 sm:p-6">
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
                    {selectedMedia && selectedMedia.youtube_url && !youtubeEmbedUrl(selectedMedia.youtube_url) && <a href={selectedMedia.youtube_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--evergreen)] px-4 py-2.5 text-sm font-semibold text-white">Ver en YouTube</a>}
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
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function InlineItemGrid({ items, empty, onSelect, type }: { items: SelectedItem[]; empty: string; onSelect: (item: SelectedItem) => void; type: 'course' | 'media' | 'product' }) {
  if (items.length === 0) return <p className="rounded-xl border border-white/75 bg-white/48 px-5 py-8 text-center text-sm text-slate-600">{empty}</p>

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => {
        const product = isProduct(item) ? item : null
        const course = type === 'course' ? item as Course : null
        const mediaItem = isMediaItem(item) ? item : null
        const image = 'image_url' in item ? item.image_url : null
        const price = course ? formatPrice(course.price, course.currency || 'USD') : product ? formatPrice(product.price, product.currency) : null
        return (
          <button key={item.id} type="button" onClick={() => onSelect(item)} className="group flex min-h-28 w-full items-stretch overflow-hidden rounded-xl border border-white/80 bg-white/60 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-700/15">
            <div className="relative min-h-28 w-28 shrink-0 bg-gradient-to-br from-cyan-100/80 via-white/55 to-rose-100/70 sm:w-40">
              {image ? <img src={image} alt={item.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[var(--evergreen)]/55">{type === 'course' ? <GraduationCap className="h-8 w-8" /> : type === 'product' ? <ShoppingBag className="h-8 w-8" /> : <Clapperboard className="h-8 w-8" />}</div>}
            </div>
            <span className="flex min-w-0 flex-1 items-center gap-3 p-3 sm:p-4">
              <span className="min-w-0">
                <span className="block line-clamp-2 font-serif text-base font-semibold leading-snug text-slate-800 sm:text-lg">{item.title}</span>
                {item.description && <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm">{item.description}</span>}
                {price && <span className="mt-2 block text-sm font-semibold text-[var(--evergreen)]">{price}</span>}
                {mediaItem && <span className="mt-2 block text-xs font-medium text-[var(--evergreen)]">{mediaItem.media_type === 'podcast' ? 'Escuchar conversación' : 'Ver video'}</span>}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/55 text-slate-600 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/85 hover:text-[var(--evergreen)]"
    >
      {children}
    </a>
  )
}
