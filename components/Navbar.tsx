'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="relative z-30 border-b border-white/60 bg-white/55 shadow-[0_8px_28px_-20px_rgba(27,43,61,0.6)] backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/ada-lovelace.png"
                alt="Retrato de Ada Lovelace"
                width={44}
                height={44}
                priority
                className="h-10 w-10 rounded-full border border-emerald-900/15 object-cover object-[50%_28%]"
              />
              <span className="font-serif text-xl font-semibold tracking-normal text-[#243431]">Ciencia Poética</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-800">
              Explorar
            </Link>
            
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-800">
                  Mi Panel
                </Link>
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-800">
                  Iniciar Sesión
                </Link>
                <Link href="/auth/register" className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900">
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
              aria-expanded={isMenuOpen}
              aria-controls="primary-mobile-menu"
              className="rounded-md p-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
            <div id="primary-mobile-menu" className="absolute inset-x-0 top-full border-b border-emerald-950/10 bg-white/95 px-4 pb-4 shadow-xl backdrop-blur-xl md:hidden">
              <div className="space-y-1 pt-3">
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="block rounded-md px-3 py-3 text-base font-medium text-gray-700 hover:bg-emerald-50">
                  Explorar contenido
                </Link>
              
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="block rounded-md px-3 py-3 text-base font-medium text-gray-700 hover:bg-emerald-50">
                    Mi Panel
                  </Link>
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {user.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full rounded-md px-3 py-3 text-left text-base font-medium text-gray-700 hover:bg-emerald-50"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)} className="block rounded-md px-3 py-3 text-base font-medium text-gray-700 hover:bg-emerald-50">
                    Iniciar Sesión
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMenuOpen(false)} className="block rounded-md bg-emerald-800 px-3 py-3 text-base font-medium text-white hover:bg-emerald-900">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
