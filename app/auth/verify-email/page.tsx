'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
              <Mail className="h-6 w-6 text-primary-600" />
            </div>
            
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verifica tu correo
            </h2>
            
            <p className="mt-4 text-sm text-gray-600">
              Hemos enviado un enlace de verificación a tu correo electrónico.
              Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            
            <div className="mt-6">
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
    </div>
  )
}
