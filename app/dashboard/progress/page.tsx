'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Clock, TrendingUp, Award } from 'lucide-react'

interface CourseProgress {
  course_id: string
  course_title: string
  progress: number
  total_lessons: number
  completed_lessons: number
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [totalProgress, setTotalProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Obtener inscripciones con progreso
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching enrollments:', error)
        return
      }

      // Obtener progreso de lecciones para cada curso
      const progressPromises = enrollments?.map(async (enrollment) => {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', enrollment.course_id)

        const { data: completedLessons } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .in('lesson_id', lessons?.map(l => l.id) || [])
          .eq('completed', true)

        const totalLessons = lessons?.length || 0
        const completedCount = completedLessons?.length || 0
        const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

        return {
          course_id: enrollment.course_id,
          course_title: enrollment.courses?.title || 'Curso sin título',
          progress,
          total_lessons: totalLessons,
          completed_lessons: completedCount
        }
      }) || []

      const progressResults = await Promise.all(progressPromises)
      setProgressData(progressResults)

      // Calcular progreso total
      const totalProgressValue = progressResults.length > 0 
        ? Math.round(progressResults.reduce((sum, course) => sum + course.progress, 0) / progressResults.length)
        : 0
      setTotalProgress(totalProgressValue)

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
          <p className="mt-4 text-gray-600">Cargando progreso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Progreso</h1>
          <p className="mt-2 text-gray-600">Sigue tu avance en todos los cursos</p>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Progreso General</h2>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso promedio</span>
                <span className="text-sm font-medium text-gray-900">{totalProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{totalProgress}%</div>
              <div className="text-sm text-gray-500">Completado</div>
            </div>
          </div>
        </div>

        {/* Course Progress List */}
        {progressData.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes progreso aún</h3>
            <p className="text-gray-600 mb-6">Inscríbete en un curso para comenzar a aprender</p>
            <button
              onClick={() => router.push('/courses')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Explorar cursos
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {progressData.map((course) => (
              <div key={course.course_id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{course.course_title}</h3>
                    <p className="text-sm text-gray-600">
                      {course.completed_lessons} de {course.total_lessons} lecciones completadas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{course.progress}%</div>
                    <div className="text-sm text-gray-500">Completado</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{course.completed_lessons} completadas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{course.total_lessons - course.completed_lessons} pendientes</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/courses/${course.course_id}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    {course.progress === 100 ? 'Revisar' : 'Continuar'}
                  </button>
                </div>

                {course.progress === 100 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Award className="h-5 w-5" />
                      <span className="font-medium">¡Felicidades! Has completado este curso</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
