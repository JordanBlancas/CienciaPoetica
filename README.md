# LMS Moderno - Plataforma de Aprendizaje

Una plataforma moderna de gestión de aprendizaje (LMS) construida con Next.js, Supabase y Tailwind CSS. Similar a WordPress + Tutor LMS pero con un stack tecnológico moderno y desplegable en Vercel.

## 🚀 Características

- **Frontend Moderno**: Next.js 14 con App Router y TypeScript
- **Backend Robusto**: Supabase para base de datos, autenticación y storage
- **Diseño Responsivo**: Tailwind CSS para una interfaz moderna y adaptable
- **Autenticación Completa**: Sistema de roles (estudiante, instructor, admin)
- **CRUD Completo**: Gestión de cursos, lecciones y usuarios
- **Panel de Usuario**: Dashboard personalizado con progreso de aprendizaje
- **Seguridad**: Row Level Security (RLS) en Supabase
- **Despliegue Fácil**: Configurado para Vercel con GitHub Actions

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Iconos**: Lucide React
- **Despliegue**: Vercel
- **Control de Versiones**: Git + GitHub

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de GitHub (opcional, para despliegue)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/lms-moderno.git
cd lms-moderno
```

### 2. Instalar Dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
NEXT_PUBLIC_BUILDER_API_KEY=tu_clave_de_builder_io (opcional)
```

### 4. Configurar Supabase

#### Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Obtén la URL y la clave anónima desde Settings > API

#### Configurar Base de Datos

Ejecuta los siguientes comandos SQL en el editor SQL de Supabase:

```sql
-- Crear tabla de usuarios extendida
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'instructor', 'admin')) DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de cursos
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de lecciones
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de inscripciones
CREATE TABLE public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(user_id, course_id)
);

-- Crear tabla de progreso de lecciones
CREATE TABLE public.lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para courses
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Instructors can manage their courses" ON public.courses
  FOR ALL USING (auth.uid() = instructor_id);

-- Políticas RLS para lessons
CREATE POLICY "Anyone can view lessons of published courses" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = lessons.course_id 
      AND courses.is_published = true
    )
  );

CREATE POLICY "Instructors can manage lessons of their courses" ON public.lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = lessons.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- Políticas RLS para enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enrollments" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" ON public.enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para lesson_progress
CREATE POLICY "Users can view own progress" ON public.lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON public.lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'instructor' THEN 'instructor'
      ELSE 'student'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

  Para habilitar la administración de perfiles y las operaciones seguras de roles y usuarios, ejecuta también `supabase-admin-policies.sql` en el editor SQL de Supabase. Si el proyecto ya existe, ejecuta solo esa migración; también evita que el rol de administrador se asigne durante el registro público.

### 5. Ejecutar en Desarrollo

```bash
npm run dev
# o
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🚀 Despliegue en Vercel

### 1. Conectar con GitHub

1. Haz push de tu código a GitHub
2. Ve a [vercel.com](https://vercel.com) y conecta tu cuenta de GitHub
3. Importa tu repositorio

### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, ve a Settings > Environment Variables y agrega:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BUILDER_API_KEY` (opcional)

### 3. Desplegar

Vercel desplegará automáticamente cada vez que hagas push a la rama principal.

## 📁 Estructura del Proyecto

```
lms-moderno/
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   ├── courses/           # Páginas de cursos
│   ├── dashboard/         # Panel de usuario
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes reutilizables
│   ├── CourseCard.tsx     # Tarjeta de curso
│   ├── Navbar.tsx         # Barra de navegación
│   └── Sidebar.tsx        # Barra lateral del dashboard
├── lib/                   # Utilidades y configuración
│   └── supabaseClient.ts  # Cliente de Supabase
├── public/                # Archivos estáticos
├── .gitignore            # Archivos ignorados por Git
├── next.config.js        # Configuración de Next.js
├── package.json          # Dependencias del proyecto
├── tailwind.config.js    # Configuración de Tailwind
└── tsconfig.json         # Configuración de TypeScript
```

## 🎯 Funcionalidades Implementadas

### ✅ Completadas

- [x] Estructura base del proyecto Next.js
- [x] Configuración de Supabase
- [x] Componentes reutilizables (Navbar, CourseCard, Sidebar)
- [x] Página principal con listado de cursos
- [x] Sistema de autenticación (login/register)
- [x] Rutas dinámicas para cursos
- [x] Dashboard de usuario
- [x] Sistema de roles básico
- [x] Diseño responsivo con Tailwind CSS

### 🚧 Por Implementar

- [ ] Panel de administración completo
- [ ] Creación y edición de cursos
- [ ] Sistema de lecciones con videos
- [ ] Seguimiento de progreso detallado
- [ ] Sistema de pagos
- [ ] Notificaciones
- [ ] Integración con Builder.io
- [ ] Tests unitarios y de integración

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de [Next.js](https://nextjs.org/docs)
2. Consulta la documentación de [Supabase](https://supabase.com/docs)
3. Abre un issue en GitHub
4. Contacta al equipo de desarrollo

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el framework
- [Supabase](https://supabase.com/) por el backend
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de diseño
- [Lucide](https://lucide.dev/) por los iconos
- [Vercel](https://vercel.com/) por el hosting

---

**¡Disfruta construyendo tu plataforma de aprendizaje! 🎓**
