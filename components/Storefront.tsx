'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Brain, BookOpen, Clapperboard, Facebook, Github, Globe2, GraduationCap, Instagram, Linkedin, Mic2, Music2, ShoppingBag, X, X as XBrand, Youtube } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionKey, string>>>({})

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
    let cancelled = false

    const prefetchContent = async () => {
      const [courseResult, mediaResult, productResult] = await Promise.all([
        supabase.from('courses').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(10),
        supabase.from('media_items').select('id,title,description,image_url,youtube_url,media_type').eq('is_published', true).order('published_at', { ascending: false }).limit(20),
        supabase.from('products').select('id,title,description,image_url,price,currency,stripe_price_id').eq('is_published', true).order('created_at', { ascending: false }).limit(20),
      ])

      if (cancelled) return

      const errors: Partial<Record<SectionKey, string>> = {}
      if (courseResult.error) {
        console.error('Error loading courses:', courseResult.error)
        errors.courses = 'No se pudieron cargar los cursos. Inténtalo de nuevo.'
      } else {
        setCourses(courseResult.data || [])
      }

      if (mediaResult.error) {
        console.error('Error loading media:', mediaResult.error)
        errors.videos = 'No se pudieron cargar los videos. Inténtalo de nuevo.'
        errors.podcast = 'No se pudieron cargar los episodios. Inténtalo de nuevo.'
      } else {
        setMedia((mediaResult.data || []) as MediaItem[])
      }

      if (productResult.error) {
        console.error('Error loading products:', productResult.error)
        errors.store = 'No se pudieron cargar los productos. Inténtalo de nuevo.'
      } else {
        setProducts((productResult.data || []) as Product[])
      }

      setSectionErrors(errors)
      setLoading(false)
    }

    prefetchContent()
    return () => { cancelled = true }
  }, [])

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
                  setMessage('')
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
            ) : sectionErrors[active.key] ? (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">{sectionErrors[active.key]}</p>
            ) : (
              <InlineItemGrid
                items={active.key === 'courses' ? courses : active.key === 'store' ? products : media.filter((item) => item.media_type === (active.key === 'videos' ? 'video' : 'podcast'))}
                empty={active.key === 'courses' ? 'Los cursos aparecerán aquí cuando estén publicados.' : active.key === 'videos' ? 'Los videos y noticias aparecerán aquí cuando haya contenido publicado.' : active.key === 'podcast' ? 'Las primeras conversaciones aparecerán aquí cuando se publique un episodio.' : 'La primera colección de tazas, polos y objetos de Ciencia Poética está en preparación.'}
                onSelect={setSelectedItem}
                type={active.key === 'courses' ? 'course' : active.key === 'store' ? 'product' : 'media'}
              />
            )}
          </section>
        )}

        <section className="relative isolate my-5 min-h-[430px] py-12 sm:my-8 sm:min-h-[500px] sm:py-14 md:my-12 md:min-h-[590px] md:py-20">
          <div aria-hidden="true" className="ada-hero-bleed pointer-events-none absolute inset-y-0">
            <div className="ada-portrait-frame opacity-45 md:opacity-55">
              <Image
                src="/images/ada-lovelace.png"
                alt=""
                fill
                sizes="(max-width: 768px) 94vw, 36vw"
                className="object-contain"
              />
            </div>
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

        <section className="grid gap-3 border-t border-slate-300/55 py-5 sm:py-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-3">
              <Image
                src="/images/jordan-blancas.jpg"
                alt="Jordan Blancas"
                width={52}
                height={52}
                className="h-11 w-11 shrink-0 rounded-full border border-white/85 object-cover shadow-[0_12px_30px_-18px_rgba(27,43,61,0.55)] sm:h-12 sm:w-12"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--evergreen)]">Sobre el autor</p>
                <h2 className="mt-0.5 font-serif text-base font-semibold tracking-normal text-slate-800 sm:text-lg">Jordan Blancas</h2>
              </div>
            </div>
            <nav aria-label="Redes sociales de Jordan Blancas" className="flex max-w-[15rem] flex-wrap gap-1.5">
              <SocialLink small href="https://www.facebook.com/jordanblancas" label="Facebook"><Facebook /></SocialLink>
              <SocialLink small href="https://www.instagram.com/jordanblancas" label="Instagram"><Instagram /></SocialLink>
              <SocialLink small href="https://pe.linkedin.com/in/jordanblancas" label="LinkedIn"><Linkedin /></SocialLink>
              <SocialLink small href="https://jordanblancas.com" label="Sitio web"><Globe2 /></SocialLink>
              <SocialLink small href="https://polimatas.club/jordanblancas" label="Polímatas Club"><Brain /></SocialLink>
              <SocialLink small href="https://github.com/JordanBlancas" label="GitHub"><Github /></SocialLink>
              <SocialLink small href="https://x.com/jordanblancas" label="X"><XBrand /></SocialLink>
              <SocialLink small href="https://www.tiktok.com/@jordan.blancas" label="TikTok"><Music2 /></SocialLink>
            </nav>
          </div>
          <p className="max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
            Ingeniero y docente universitario. Me interesa explorar cómo dialogan las matemáticas, la ciencia, la tecnología y la ingeniería con la creatividad. En Ciencia Poética comparto esa búsqueda mediante cursos, conversarios y proyectos.
          </p>
        </section>

        <footer className="mt-10 border-t border-slate-300/55 py-6 sm:mt-12 sm:py-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-center">
            <div>
              <p className="font-serif text-base font-semibold text-slate-800">Ciencia Poética</p>
              <p className="mt-1 text-[11px] text-slate-500">Canales oficiales del proyecto</p>
            </div>
            <nav aria-label="Redes sociales de Ciencia Poética" className="flex flex-wrap justify-center gap-2">
              <SocialLink href="https://www.facebook.com/CienciaPoetica/" label="Facebook de Ciencia Poética"><Facebook /></SocialLink>
              <SocialLink href="https://www.instagram.com/Ciencia.Poetica/" label="Instagram de Ciencia Poética"><Instagram /></SocialLink>
              <SocialLink href="https://www.youtube.com/@cienciapoetica" label="YouTube de Ciencia Poética"><Youtube /></SocialLink>
              <SocialLink href="https://www.tiktok.com/@cienciapoetica/" label="TikTok de Ciencia Poética"><Music2 /></SocialLink>
            </nav>
          </div>
          <div className="mt-5 flex flex-col items-center gap-1 border-t border-slate-300/40 pt-4 text-center text-[11px] leading-5 text-slate-500">
            <p>© 2026 Ciencia Poética. Todos los derechos reservados.</p>
            <p>Hecho con <span role="img" aria-label="amor">❤️</span> por <a href="https://virtualflow.tech" target="_blank" rel="noreferrer" className="font-medium text-slate-600 underline decoration-slate-400/50 underline-offset-2 hover:text-[var(--evergreen)]">virtualflow.tech</a></p>
          </div>
        </footer>

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

function SocialLink({ href, label, children, small = false }: { href: string; label: string; children: React.ReactNode; small?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full text-slate-600 transition hover:-translate-y-0.5 hover:text-[var(--evergreen)] ${small ? 'h-7 w-7 border border-slate-300/70 hover:border-[var(--evergreen)] [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:stroke-[1.5]' : 'h-10 w-10 border border-white/80 bg-white/55 shadow-sm backdrop-blur-xl hover:bg-white/85'}`}
    >
      {children}
    </a>
  )
}
