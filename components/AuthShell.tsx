import Image from 'next/image'
import Link from 'next/link'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-page relative flex min-h-screen flex-col overflow-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(49,109,103,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(49,109,103,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/ada-lovelace.png"
            alt="Retrato de Ada Lovelace"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full border border-white/80 object-cover object-[50%_28%] shadow-sm"
          />
          <span className="font-serif text-lg font-semibold text-[#17212b]">Ciencia Poética</span>
        </Link>
        <Link href="/" className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/60 hover:text-slate-900">
          Inicio
        </Link>
      </header>
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
        {children}
      </main>
      <footer className="relative py-2 text-center text-xs text-slate-500">
        Matemáticas, ingeniería e imaginación. Por siempre Ada.
      </footer>
    </div>
  )
}
