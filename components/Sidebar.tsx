'use client'

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
  GraduationCap
} from 'lucide-react'

interface SidebarProps {
  userRole?: 'student' | 'instructor' | 'admin'
}

export default function Sidebar({ userRole = 'student' }: SidebarProps) {
  const pathname = usePathname()

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
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Panel de Control</h2>
      </div>
      
      <nav className="mt-6">
        <div className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
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
    </div>
  )
}
