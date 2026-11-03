'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  BookOpen, 
  User, 
  Settings, 
  BarChart3, 
  Plus,
  Users,
  GraduationCap,
  Menu,
  X
} from 'lucide-react'

interface SidebarProps {
  userRole?: 'student' | 'instructor' | 'admin'
}

export default function Sidebar({ userRole = 'student' }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      touchStart.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      const start = touchStart.current
      touchStart.current = null
      if (!start || !window.matchMedia('(max-width: 767px)').matches) return

      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - start.x
      const deltaY = Math.abs(touch.clientY - start.y)
      if (deltaY > 60) return

      if (!isMobileMenuOpen && start.x < 28 && deltaX > 80) {
        setIsMobileMenuOpen(true)
      } else if (isMobileMenuOpen && deltaX < -80) {
        setIsMobileMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  const studentMenu = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Mis Cursos', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Progreso', href: '/dashboard/progress', icon: BarChart3 },
    { name: 'Perfil', href: '/dashboard/profile', icon: User },
  ]

  const instructorMenu = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Mis Cursos', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Crear Curso', href: '/dashboard/courses/create', icon: Plus },
    { name: 'Estudiantes', href: '/dashboard/students', icon: Users },
    { name: 'Estadísticas', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Perfil', href: '/dashboard/profile', icon: User },
  ]

  const adminMenu = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Todos los Cursos', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users },
    { name: 'Instructores', href: '/dashboard/instructors', icon: GraduationCap },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ]

  const getMenuItems = () => {
    switch (userRole) {
      case 'instructor':
        return instructorMenu
      case 'admin':
        return adminMenu
      default:
        return studentMenu
    }
  }

  const menuItems = getMenuItems()

  return (
    <>
      <div className="flex w-full items-center justify-between border-b bg-white px-4 py-3 shadow-sm md:hidden">
        <h2 className="text-lg font-semibold text-gray-900">Panel de Control</h2>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Abrir navegación del panel"
          aria-expanded={isMobileMenuOpen}
          aria-controls="dashboard-sidebar"
          className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Cerrar navegación del panel"
          tabIndex={-1}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        id="dashboard-sidebar"
        className={`${isMobileMenuOpen ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-white shadow-lg md:sticky md:top-0 md:block md:h-screen md:shrink-0`}
      >
        <div className="flex items-center justify-between p-6">
          <h2 className="text-lg font-semibold text-gray-900">Panel de Control</h2>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar navegación del panel"
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 pb-6">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>
    </>
  )
}
