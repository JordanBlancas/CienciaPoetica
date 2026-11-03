'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Course, Lesson } from '@/lib/supabaseClient'
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  BookOpen, 
  List, 
  CheckCircle, 
  Plus,
  Edit,
  Trash2,
  GripVertical,
  AlertCircle,
  Eye,
  Rocket
} from 'lucide-react'

type TabType = 'info' | 'lessons' | 'publish'

export default function CourseEditorPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    image_url: ''
  })

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'info' || tab === 'lessons' || tab === 'publish') {
      setActiveTab(tab)
    }
  }, [])

  const fetchCourseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) {
        console.error('Error fetching course:', courseError)
        router.push('/dashboard/courses')
        return
      }

      // Verify ownership
      if (courseData.instructor_id !== user.id) {
        router.push('/dashboard/courses')
        return
      }

      setCourse(courseData)
      setFormData({
        title: courseData.title,
        description: courseData.description || '',
        price: courseData.price,
        image_url: courseData.image_url || ''
      })

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (!lessonsError) {
        setLessons(lessonsData || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSaveCourseInfo = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          image_url: formData.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)

      if (error) {
        alert('Error al guardar los cambios')
        console.error(error)
      } else {
        alert('Cambios guardados exitosamente')
        await fetchCourseData()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta lección?')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) {
        alert('Error al eliminar la lección')
        console.error(error)
      } else {
        await fetchCourseData()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleReorderLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId)
    if (currentIndex === -1) return
    
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (swapIndex < 0 || swapIndex >= lessons.length) return

    const newLessons = [...lessons]
    const temp = newLessons[currentIndex]
    newLessons[currentIndex] = newLessons[swapIndex]
    newLessons[swapIndex] = temp

    // Update order_index for both lessons
    try {
      await Promise.all([
        supabase
          .from('lessons')
          .update({ order_index: swapIndex })
          .eq('id', newLessons[swapIndex].id),
        supabase
          .from('lessons')
          .update({ order_index: currentIndex })
          .eq('id', newLessons[currentIndex].id)
      ])
      
      setLessons(newLessons)
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }

  const handleTogglePublish = async () => {
    if (!course) return

    const newStatus = !course.is_published

    // Validate before publishing
    if (newStatus && !isReadyToPublish()) {
      alert('El curso no cumple los requisitos mínimos para publicarse')
      return
    }

    if (newStatus && !confirm('¿Estás seguro de publicar este curso? Los estudiantes podrán verlo e inscribirse.')) {
      return
    }

    if (!newStatus && !confirm('¿Despublicar este curso? Los estudiantes ya no podrán verlo ni inscribirse.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: newStatus })
        .eq('id', courseId)

      if (error) {
        alert('Error al cambiar el estado de publicación')
        console.error(error)
      } else {
        await fetchCourseData()
        alert(newStatus ? '¡Curso publicado exitosamente!' : 'Curso despublicado')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const isReadyToPublish = () => {
    if (!course) return false
    return (
      course.title.trim().length > 0 &&
      course.description && course.description.trim().length >= 50 &&
      lessons.length >= 1
    )
  }

  const getPublishChecklist = () => {
    if (!course) return []
    return [
      { 
        label: 'Título del curso', 
        completed: course.title.trim().length > 0,
        description: 'El curso debe tener un título'
      },
      { 
        label: 'Descripción completa', 
        completed: course.description && course.description.trim().length >= 50,
        description: 'Mínimo 50 caracteres'
      },
      { 
        label: 'Al menos 1 lección', 
        completed: lessons.length >= 1,
        description: 'El curso debe tener contenido'
      },
      { 
        label: 'Imagen del curso (opcional)', 
        completed: !!course.image_url,
        description: 'Recomendado para mejor presentación'
      }
    ]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Curso no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/courses')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Cursos
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Curso</h1>
              <p className="mt-2 text-gray-600">{course.title}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {course.is_published ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Publicado
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  Borrador
                </span>
              )}
              
              <button
                onClick={() => router.push(`/courses/${courseId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <Eye className="h-4 w-4" />
                Vista Previa
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Información del Curso
              </button>
              
              <button
                onClick={() => setActiveTab('lessons')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'lessons'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <List className="h-4 w-4" />
                Lecciones ({lessons.length})
              </button>
              
              <button
                onClick={() => setActiveTab('publish')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'publish'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Rocket className="h-4 w-4" />
                Publicar
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Información del Curso */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="h-4 w-4 inline mr-2" />
                    Imagen del Curso
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {formData.image_url ? (
                        <img 
                          src={formData.image_url} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        URL de la imagen del curso
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Curso *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ej: Introducción a React"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Curso *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe qué aprenderán los estudiantes en este curso..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.description.length} caracteres (mínimo 50 para publicar)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio del Curso (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Deja en $0 para un curso gratuito
                  </p>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveCourseInfo}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Lecciones */}
            {activeTab === 'lessons' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Contenido del Curso</h3>
                    <p className="text-sm text-gray-600">Organiza las lecciones de tu curso</p>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/new`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Lección
                  </button>
                </div>

                {lessons.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <List className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay lecciones aún
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Comienza agregando tu primera lección
                    </p>
                    <button
                      onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/new`)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      Crear primera lección
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson, index) => (
                      <div 
                        key={lesson.id} 
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white hover:border-blue-300 transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReorderLesson(lesson.id, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReorderLesson(lesson.id, 'down')}
                            disabled={index === lessons.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900">{lesson.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {lesson.content ? lesson.content.substring(0, 100) + '...' : 'Sin contenido'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/${lesson.id}/edit`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar lección"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar lección"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Publicar */}
            {activeTab === 'publish' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Estado de Publicación
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {course.is_published 
                      ? 'Tu curso está publicado y visible para los estudiantes' 
                      : 'Tu curso está en modo borrador. Completa los requisitos para publicarlo'
                    }
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Requisitos para Publicar
                  </h4>
                  <div className="space-y-3">
                    {getPublishChecklist().map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        {item.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${item.completed ? 'text-green-900' : 'text-gray-700'}`}>
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  {course.is_published ? (
                    <button
                      onClick={handleTogglePublish}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                      <AlertCircle className="h-5 w-5" />
                      Despublicar Curso
                    </button>
                  ) : (
                    <button
                      onClick={handleTogglePublish}
                      disabled={!isReadyToPublish()}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Rocket className="h-5 w-5" />
                      {isReadyToPublish() ? 'Publicar Curso' : 'Completar Requisitos para Publicar'}
                    </button>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    {course.is_published 
                      ? 'Los estudiantes ya no podrán ver el curso ni inscribirse'
                      : 'Los estudiantes podrán ver el curso e inscribirse'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
