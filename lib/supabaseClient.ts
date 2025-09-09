import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface Course {
  id: string
  title: string
  description: string
  image_url?: string
  price: number
  instructor_id: string
  created_at: string
  updated_at: string
  is_published: boolean
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  content: string
  video_url?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  role: 'student' | 'instructor' | 'admin'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  progress: number
}

export interface Progress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at?: string
}
