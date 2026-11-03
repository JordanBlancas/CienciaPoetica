import Navbar from '@/components/Navbar'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-page relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(49,109,103,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(49,109,103,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <Navbar />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-start px-4 py-6 sm:justify-center sm:px-6 sm:py-8">
        {children}
      </main>
      <footer className="relative px-4 py-3 text-center text-xs text-slate-500">
        Matemáticas, ingeniería e imaginación. Por siempre Ada.
      </footer>
    </div>
  )
}
