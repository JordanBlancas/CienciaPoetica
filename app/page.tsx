'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Mic2, Search, Sparkles, Youtube } from 'lucide-react'
import CourseCard from '@/components/CourseCard'
import Navbar from '@/components/Navbar'
import { Course, supabase } from '@/lib/supabaseClient'

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching courses:', error)
      } else {
        setCourses(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div id="top" className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden border-b border-emerald-950/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(39,94,83,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(39,94,83,0.07)_1px,transparent_1px)] [background-size:52px_52px]"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-5 px-4 py-6 sm:px-6 md:min-h-[620px] md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:px-8 md:py-12 lg:px-12">
            <div className="max-w-2xl">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--evergreen)] sm:text-sm">
                <Sparkles className="h-4 w-4" />
                Matemáticas · Ingeniería · Imaginación
              </p>
              <h1 className="font-serif text-[2.75rem] font-medium leading-[0.98] tracking-normal text-[#20302d] sm:text-6xl md:text-7xl">
                Ciencia <span className="italic text-[var(--evergreen)]">Poética</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#52615d] sm:text-lg sm:leading-8">
                La ciencia también puede ser una forma de belleza. Un espacio para aprender, crear y conversar donde el rigor se encuentra con la imaginación.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="#cursos"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--evergreen)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d493f]"
                >
                  Explorar cursos <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#podcast"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-emerald-900/20 bg-white/70 px-5 py-3 text-sm font-semibold text-[#29443e] backdrop-blur-md transition-colors hover:bg-white"
                >
                  <Mic2 className="h-4 w-4" /> Podcast
                </Link>
              </div>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-[#75817c]">
                Cursos propios · Conversaciones con ideas
              </p>
            </div>

            <figure className="relative mx-auto w-full max-w-[500px] md:ml-auto">
              <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-[#d8d5ca] shadow-[0_24px_70px_-35px_rgba(27,54,46,0.55)] md:aspect-[4/5]">
                <Image
                  src="/images/ada-lovelace.png"
                  alt="Retrato de Ada Lovelace, pintado por Margaret Sarah Carpenter"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 42vw"
                  className="object-cover object-[50%_25%] md:object-[50%_28%]"
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-white/50" />
                <figcaption className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 rounded-md border border-white/50 bg-white/75 px-4 py-3 text-xs text-[#263b35] shadow-lg backdrop-blur-xl sm:inset-x-6 sm:bottom-6">
                  <span><strong className="block text-sm">Ada Lovelace</strong>Margaret Sarah Carpenter · 1836</span>
                  <a
                    href="https://commons.wikimedia.org/wiki/File:Carpenter_portrait_of_Ada_Lovelace_-_detail.png"
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 underline decoration-emerald-800/40 underline-offset-4 hover:text-[var(--evergreen)]"
                  >
                    Dominio público
                  </a>
                </figcaption>
              </div>
            </figure>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:px-8 md:py-20 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral)]">Una idea que inspira</p>
            <h2 className="mt-3 max-w-md font-serif text-3xl leading-tight tracking-normal text-[#20302d] sm:text-4xl">
              El conocimiento también tiene una voz propia.
            </h2>
          </div>
          <div className="max-w-2xl text-base leading-7 text-[#52615d] sm:text-lg sm:leading-8">
            <p>
              En <em>Los innovadores</em>, Walter Isaacson presenta a Ada Lovelace como una pionera que imaginó la relación entre las máquinas, las matemáticas y la creatividad. Esa unión es el corazón de Ciencia Poética.
            </p>
            <p className="mt-5 border-l-2 border-[var(--coral)] pl-5 font-serif text-2xl italic leading-snug text-[#29443e]">
              «Por siempre Ada».
              <span className="mt-2 block font-sans text-xs not-italic uppercase tracking-[0.12em] text-[#75817c]">Walter Isaacson, Los innovadores</span>
            </p>
          </div>
        </section>

        <section id="cursos" className="scroll-mt-20 border-y border-emerald-950/10 bg-[#edf1eb]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8 md:py-20 lg:px-12">
            <div className="mb-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--evergreen)]">Aprender haciendo</p>
                <h2 className="mt-3 font-serif text-3xl tracking-normal text-[#20302d] sm:text-4xl">Cursos con propósito</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52615d] sm:text-base">
                  Pocos cursos, ideas que dejan huella. Matemáticas e ingeniería para comprender mejor y construir con intención.
                </p>
              </div>
              <label className="relative block w-full md:w-72">
                <span className="sr-only">Buscar cursos</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Buscar cursos"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="min-h-11 w-full rounded-md border border-emerald-950/15 bg-white/80 py-2 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                />
              </label>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando cursos">
                {[0, 1, 2].map((index) => <div key={index} className="h-72 animate-pulse rounded-md bg-white/70" />)}
              </div>
            ) : filteredCourses.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => <CourseCard key={course.id} course={course} />)}
              </div>
            ) : (
              <div className="border-t border-emerald-950/15 py-10">
                <p className="font-serif text-2xl text-[#29443e]">{searchTerm ? 'No encontramos ese curso.' : 'Los primeros cursos están tomando forma.'}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#52615d]">
                  {searchTerm ? 'Prueba con otros términos.' : 'Aquí aparecerán cursos propios de matemáticas e ingeniería cuando estén publicados.'}
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="podcast" className="scroll-mt-20 overflow-hidden bg-[#203b35] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-8 md:py-20 lg:px-12">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#a9d2c2]">
                <Mic2 className="h-4 w-4" /> Ciencia Poética · Conversaciones
              </p>
              <h2 className="mt-4 max-w-xl font-serif text-3xl leading-tight tracking-normal sm:text-5xl">
                Ideas que merecen una conversación.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
                Entrevistas sobre ciencia, tecnología, matemáticas e ingeniería: las preguntas, los hallazgos y las personas detrás de cada idea.
              </p>
            </div>
            <div className="border-l border-white/20 py-2 pl-6 sm:pl-8">
              <Youtube className="h-7 w-7 text-[#f09a78]" />
              <p className="mt-4 font-serif text-2xl">Próximamente en YouTube</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Las conversaciones completas se publicarán en YouTube. Aquí reuniremos cada episodio y sus ideas clave cuando el canal esté listo.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-emerald-950/10 bg-[var(--paper)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-sm text-[#66736e] sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
          <Link href="/" className="font-serif text-lg font-semibold text-[#29443e]">Ciencia Poética</Link>
          <p>Matemáticas, ingeniería e imaginación. Por siempre Ada.</p>
          <Link href="#top" className="inline-flex items-center gap-2 hover:text-[var(--evergreen)]">
            Volver arriba <ArrowDown className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </footer>
    </div>
  )
}
