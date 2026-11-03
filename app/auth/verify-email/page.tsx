'use client'

import Link from 'next/link'
import AuthShell from '@/components/AuthShell'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel-strong rounded-3xl px-5 py-8 sm:px-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/65 text-[var(--evergreen)] shadow-sm">
              <Mail className="h-6 w-6" />
            </div>
            
            <h2 className="mt-6 font-serif text-3xl font-semibold tracking-normal text-slate-900">
              Verifica tu correo
            </h2>
            
            <p className="mt-4 text-sm text-gray-600">
              Hemos enviado un enlace de verificación a tu correo electrónico.
              Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            
            <div className="mt-6">
              <Link
                href="/auth/login"
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--evergreen)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#285d58] focus:outline-none focus:ring-4 focus:ring-emerald-700/15"
              >
                Volver al inicio de sesión
              </Link>
            </div>
            
            <p className="mt-4 text-xs text-gray-500">
              ¿No recibiste el correo? Revisa tu carpeta de spam o{' '}
              <button className="text-primary-600 hover:text-primary-500">
                solicita uno nuevo
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
