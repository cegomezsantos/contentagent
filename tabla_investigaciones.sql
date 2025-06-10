-- Script para crear la tabla investigaciones_sesiones
-- Esta tabla almacenará las investigaciones generadas para cada sesión de los cursos

-- Crear tabla para almacenar investigaciones de sesiones
CREATE TABLE IF NOT EXISTS public.investigaciones_sesiones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id uuid REFERENCES public.cursos(id) ON DELETE CASCADE,
    numero_sesion integer NOT NULL,
    tema_sesion text NOT NULL,
    contenido_investigacion text NOT NULL,
    estado text NOT NULL DEFAULT 'completada' CHECK (estado IN ('pendiente', 'procesando', 'completada', 'error')),
    fecha_investigacion timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.investigaciones_sesiones ENABLE ROW LEVEL SECURITY;

-- Crear políticas para la tabla
CREATE POLICY "Enable read access for all users" ON public.investigaciones_sesiones
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.investigaciones_sesiones
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.investigaciones_sesiones
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.investigaciones_sesiones
    FOR DELETE USING (true);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_investigaciones_curso_id ON public.investigaciones_sesiones(curso_id);
CREATE INDEX IF NOT EXISTS idx_investigaciones_sesion ON public.investigaciones_sesiones(numero_sesion);
CREATE INDEX IF NOT EXISTS idx_investigaciones_estado ON public.investigaciones_sesiones(estado);
CREATE INDEX IF NOT EXISTS idx_investigaciones_fecha ON public.investigaciones_sesiones(fecha_investigacion);

-- Crear índice compuesto para búsquedas por curso y sesión
CREATE UNIQUE INDEX IF NOT EXISTS idx_investigaciones_curso_sesion 
ON public.investigaciones_sesiones(curso_id, numero_sesion);

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_investigaciones_sesiones_updated_at
    BEFORE UPDATE ON public.investigaciones_sesiones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.investigaciones_sesiones IS 'Tabla para almacenar investigaciones generadas por IA para cada sesión de los cursos';
COMMENT ON COLUMN public.investigaciones_sesiones.numero_sesion IS 'Número de la sesión dentro del curso (1, 2, 3, etc.)';
COMMENT ON COLUMN public.investigaciones_sesiones.tema_sesion IS 'Título o tema principal de la sesión';
COMMENT ON COLUMN public.investigaciones_sesiones.contenido_investigacion IS 'Investigación detallada generada por IA para esta sesión';
COMMENT ON COLUMN public.investigaciones_sesiones.estado IS 'Estado actual de la investigación';

-- Verificar que la tabla se creó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'investigaciones_sesiones' 
AND table_schema = 'public'
ORDER BY ordinal_position; 