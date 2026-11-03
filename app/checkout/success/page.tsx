import Link from 'next/link'
import { Check } from 'lucide-react'
import AuthShell from '@/components/AuthShell'

export default function CheckoutSuccessPage() {
  return (
    <AuthShell>
      <section className="glass-panel-strong rounded-3xl p-7 text-center sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/80 text-[var(--evergreen)]">
          <Check className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-semibold tracking-normal text-slate-900">Gracias por tu compra</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Stripe está confirmando el pago. El acceso al curso o el registro de tu pedido se actualizará cuando recibamos la confirmación segura.
        </p>
        <Link href="/dashboard/courses" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--evergreen)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#285d58]">
          Ir a mis cursos
        </Link>
      </section>
    </AuthShell>
  )
}
