'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { 
  Settings, 
  Globe, 
  Mail, 
  Bell,
  Shield,
  Save,
  Database,
  Key
} from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [settings, setSettings] = useState({
    siteName: 'Ciencia Poética',
    siteDescription: 'Plataforma de aprendizaje moderna',
    contactEmail: 'contacto@cienciapoetica.com',
    allowRegistration: true,
    requireEmailVerification: false,
    defaultUserRole: 'student'
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    }
  }

  const handleSave = () => {
    alert('Configuración guardada. Nota: Esta es una UI de demostración. Para implementar completamente, necesitarías una tabla de settings en la base de datos.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="mt-2 text-gray-600">Administra la configuración general de la plataforma</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración General
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Sitio
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Sitio
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Registration Settings */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Registro
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Permitir Registro</p>
                  <p className="text-sm text-gray-500">Permite que nuevos usuarios se registren</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, allowRegistration: !settings.allowRegistration})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.allowRegistration ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.allowRegistration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Verificación de Email</p>
                  <p className="text-sm text-gray-500">Requiere verificar email antes de acceder</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, requireEmailVerification: !settings.requireEmailVerification})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.requireEmailVerification ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol por Defecto
                </label>
                <select
                  value={settings.defaultUserRole}
                  onChange={(e) => setSettings({...settings, defaultUserRole: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="student">Estudiante</option>
                  <option value="instructor">Instructor</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Rol asignado a nuevos usuarios al registrarse
                </p>
              </div>
            </div>
          </div>

          {/* Database Info */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Información de la Base de Datos
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <Key className="h-4 w-4 inline mr-2" />
                  La base de datos está configurada con Supabase. Para configuración avanzada, 
                  accede al panel de Supabase directamente.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">📝 Nota de Desarrollo</h3>
          <p className="text-sm text-yellow-700">
            Esta es una interfaz de configuración básica. Para una implementación completa, 
            necesitarías crear una tabla <code className="bg-yellow-100 px-1 rounded">settings</code> en 
            la base de datos y conectarla con esta interfaz.
          </p>
        </div>
      </div>
    </div>
  )
}
