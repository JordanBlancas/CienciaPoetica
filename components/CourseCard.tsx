import Link from 'next/link'
import { Course } from '@/lib/supabaseClient'
import { ArrowUpRight, BookOpen } from 'lucide-react'

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-emerald-950/10 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(27,54,46,0.5)]">
      <div className="relative h-44 shrink-0 bg-[#dfe8df]">
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-emerald-800/60">
            <BookOpen className="h-10 w-10" strokeWidth={1.2} />
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-serif text-xl font-semibold text-[#20302d]">
          {course.title}
        </h3>
        
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#66736e]">
          {course.description || 'Detalles del curso próximamente.'}
        </p>
        
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="text-lg font-semibold text-[var(--evergreen)]">
            {course.price === 0 ? 'Gratis' : `$${course.price}`}
          </div>
          
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--evergreen)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d493f]"
          >
            Ver curso <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
