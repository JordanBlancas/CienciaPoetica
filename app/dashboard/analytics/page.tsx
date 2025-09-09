'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabaseClient'
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface AnalyticsData {
  totalStudents: number
  totalCourses: number
  totalLessons: number
  totalEnrollments: number
  recentEnrollments: any[]
  courseStats: any[]
  monthlyStats: any[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
    }
  }

  const fetchAnalytics = async () => {
    try {
      // Obtener estadísticas generales
      const [studentsResult, coursesResult, lessonsResult, enrollmentsResult] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'student'),
        supabase.from('courses').select('*'),
        supabase.from('lessons').select('*'),
        supabase.from('enrollments').select('*')
      ])

      // Obtener inscripciones recientes
      const { data: recentEnrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          profiles!enrollments_student_id_fkey(full_name, email),
          courses!enrollments_course_id_fkey(title)
        `)
        .order('enrolled_at', { ascending: false })
        .limit(5)

      // Obtener estadísticas por curso
      const { data: courseStats } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments(count)
        `)
        .order('created_at', { ascending: false })

      // Obtener estadísticas mensuales (últimos 6 meses)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { data: monthlyStats } = await supabase
        .from('enrollments')
        .select('enrolled_at')
        .gte('enrolled_at', sixMonthsAgo.toISOString())

      setAnalytics({
        totalStudents: studentsResult.data?.length || 0,
        totalCourses: coursesResult.data?.length || 0,
        totalLessons: lessonsResult.data?.length || 0,
        totalEnrollments: enrollmentsResult.data?.length || 0,
        recentEnrollments: recentEnrollments || [],
        courseStats: courseStats || [],
        monthlyStats: monthlyStats || []
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthlyData = () => {
    if (!analytics?.monthlyStats) return []
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const currentMonth = new Date().getMonth()
    const last6Months = []
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const monthName = months[monthIndex]
      const count = analytics.monthlyStats.filter(stat => {
        const statDate = new Date(stat.enrolled_at)
        return statDate.getMonth() === monthIndex
      }).length
      
      last6Months.push({ month: monthName, count })
    }
    
    return last6Months
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <div className="text-center text-gray-600 text-lg">Cargando analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <div className="text-center text-red-600 text-lg">Debes iniciar sesión para ver analytics</div>
          </div>
        </div>
      </div>
    )
  }

  const monthlyData = getMonthlyData()

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">Métricas y estadísticas de tu plataforma educativa</p>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalCourses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Lecciones</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalLessons}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Inscripciones</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalEnrollments}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de inscripciones mensuales */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Inscripciones por Mes</h3>
              </div>
              <div className="space-y-3">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-12 text-sm text-gray-600">{data.month}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.max(10, (data.count / Math.max(...monthlyData.map(d => d.count), 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-8 text-sm text-gray-900">{data.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estadísticas por curso */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <PieChart className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Cursos Populares</h3>
              </div>
              <div className="space-y-3">
                {analytics?.courseStats.slice(0, 5).map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-500">{course.enrollments?.[0]?.count || 0} estudiantes</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {Math.round(((course.enrollments?.[0]?.count || 0) / analytics.totalStudents) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inscripciones recientes */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Activity className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Inscripciones Recientes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Curso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics?.recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.profiles?.full_name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.profiles?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.courses?.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(enrollment.enrolled_at).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
