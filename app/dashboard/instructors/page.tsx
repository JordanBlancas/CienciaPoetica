'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  TrendingUp,
  Calendar,
  Mail,
  Eye
} from 'lucide-react'

interface InstructorStats {
  id: string
  email: string
  full_name: string | null
  created_at: string
  total_courses: number
  published_courses: number
  total_students: number
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorStats[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [stats, setStats] = useState({
    totalInstructors: 0,
    totalCourses: 0,
    publishedCourses: 0,
    averageCoursesPerInstructor: 0
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

      await fetchInstructors()
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    }
  }

  const fetchInstructors = async () => {
    try {
      // Get all instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'instructor')
        .order('created_at', { ascending: false })

      if (instructorsError) {
        console.error('Error fetching instructors:', instructorsError)
        return
      }

      // Get courses data for each instructor
      const instructorsWithStats = await Promise.all(
        (instructorsData || []).map(async (instructor) => {
          const { data: courses } = await supabase
            .from('courses')
            .select('id, is_published')
            .eq('instructor_id', instructor.id)

          const totalCourses = courses?.length || 0
          const publishedCourses = courses?.filter(c => c.is_published).length || 0

          // Get student count
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('user_id')
            .in('course_id', courses?.map(c => c.id) || [])

          const uniqueStudents = new Set(enrollments?.map(e => e.user_id) || [])

          return {
            ...instructor,
            total_courses: totalCourses,
            published_courses: publishedCourses,
            total_students: uniqueStudents.size
          }
        })
      )

      setInstructors(instructorsWithStats)

      // Calculate global stats
      const totalCourses = instructorsWithStats.reduce((sum, i) => sum + i.total_courses, 0)
      const publishedCourses = instructorsWithStats.reduce((sum, i) => sum + i.published_courses, 0)

      setStats({
        totalInstructors: instructorsWithStats.length,
        totalCourses,
        publishedCourses,
        averageCoursesPerInstructor: instructorsWithStats.length > 0 
          ? Math.round((totalCourses / instructorsWithStats.length) * 10) / 10 
          : 0
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando instructores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructores</h1>
          <p className="mt-2 text-gray-600">Vista general de instructores y sus cursos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Instructores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInstructors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Publicados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio/Instructor</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageCoursesPerInstructor}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructors List */}
        {instructors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay instructores aún</h3>
            <p className="text-gray-600">Los instructores aparecerán aquí cuando se registren</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Instructores</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cursos Totales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Publicados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Registro
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {instructors.map((instructor) => (
                    <tr key={instructor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {(instructor.full_name || instructor.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {instructor.full_name || 'Instructor'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {instructor.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                          {instructor.total_courses}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Eye className="h-4 w-4 mr-1 text-gray-400" />
                          {instructor.published_courses}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {instructor.total_students}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(instructor.created_at).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
