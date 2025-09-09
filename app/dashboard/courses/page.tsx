'use client'

import { useState, useEffect } from 'react'
import { supabase, Course } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { BookOpen, Users, Clock, Play, Plus } from 'lucide-react'

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    fetchUserCourses()
  }, [])

  const fetchUserCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Obtener el rol del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setUserRole(profile?.role || 'student')

      if (profile?.role === 'instructor') {
        // Si es instructor, mostrar sus cursos creados
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching instructor courses:', error)
        } else {
          setCourses(data || [])
        }
      } else {
        // Si es estudiante, mostrar cursos en los que está inscrito
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            courses (*)
          `)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching enrolled courses:', error)
        } else {
          const enrolledCourses = data?.map(enrollment => enrollment.courses).filter(Boolean) as Course[]
          setCourses(enrolledCourses || [])
        }
      }
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
          <p className="mt-4 text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {userRole === 'instructor' ? 'Mis Cursos Creados' : 'Mis Cursos'}
              </h1>
              <p className="mt-2 text-gray-600">
                {userRole === 'instructor' 
                  ? 'Gestiona los cursos que has creado'
                  : 'Continúa tu aprendizaje'
                }
              </p>
            </div>
            {userRole === 'instructor' && (
              <button
                onClick={() => router.push('/dashboard/courses/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Crear Curso
              </button>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userRole === 'instructor' ? 'No has creado cursos aún' : 'No estás inscrito en ningún curso'}
            </h3>
            <p className="text-gray-600 mb-6">
              {userRole === 'instructor' 
                ? 'Comienza creando tu primer curso'
                : 'Explora los cursos disponibles e inscríbete'
              }
            </p>
            {userRole === 'instructor' ? (
              <button
                onClick={() => router.push('/dashboard/courses/create')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Crear mi primer curso
              </button>
            ) : (
              <button
                onClick={() => router.push('/courses')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Explorar cursos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      <span>0 estudiantes</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>0 lecciones</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/courses/${course.id}`)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {userRole === 'instructor' ? 'Gestionar' : 'Continuar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
