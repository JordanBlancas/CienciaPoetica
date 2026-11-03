'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Lesson } from '@/lib/supabaseClient'
import { ArrowLeft, Save, Trash2, Video, FileText } from 'lucide-react'

export default function EditLessonPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const lessonId = params.lessonId as string
  
  const [courseName, setCourseName] = useState('')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    video_url: ''
  })

  useEffect(() => {
    fetchLesson()
  }, [courseId, lessonId])

  const fetchLesson = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Verify course ownership
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, instructor_id')
        .eq('id', courseId)
        .single()

      if (courseError || !course || course.instructor_id !== user.id) {
        router.push('/dashboard/courses')
        return
      }

      setCourseName(course.title)

      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('course_id', courseId)
        .single()

      if (lessonError || !lessonData) {
        alert('Lección no encontrada')
        router.push(`/dashboard/courses/${courseId}/edit?tab=lessons`)
        return
      }

      setLesson(lessonData)
      setFormData({
        title: lessonData.title,
        content: lessonData.content || '',
        video_url: lessonData.video_url || ''
      })
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('El título de la lección es obligatorio')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: formData.title,
          content: formData.content,
          video_url: formData.video_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId)

      if (error) {
        console.error('Error updating lesson:', error)
        alert('Error al guardar la lección')
      } else {
        alert('Lección actualizada exitosamente')
        router.push(`/dashboard/courses/${courseId}/edit?tab=lessons`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la lección')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta lección? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) {
        console.error('Error deleting lesson:', error)
        alert('Error al eliminar la lección')
      } else {
        alert('Lección eliminada')
        router.push(`/dashboard/courses/${courseId}/edit?tab=lessons`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la lección')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando lección...</p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Lección no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/courses/${courseId}/edit?tab=lessons`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al curso
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Lección</h1>
              <p className="mt-2 text-gray-600">{courseName}</p>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Lección
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Lesson Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Título de la Lección *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ej: Introducción a los Componentes"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Lesson Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido de la Lección
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Escribe el contenido de la lección aquí. Puedes incluir explicaciones, ejemplos, código, etc."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.content.length} caracteres
              </p>
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Video className="h-4 w-4 inline mr-2" />
                Video de la Lección (opcional)
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                URL de YouTube, Vimeo u otra plataforma de video
              </p>
              {formData.video_url && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Vista previa:</p>
                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/courses/${courseId}/edit?tab=lessons`)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Importante</h3>
          <p className="text-sm text-yellow-700">
            Si el curso ya está publicado, los cambios en esta lección serán visibles inmediatamente para los estudiantes.
          </p>
        </div>
      </div>
    </div>
  )
}
