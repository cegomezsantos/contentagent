-- Script para crear las tablas de comparación y actividades
-- Ejecutar manualmente en la base de datos

-- =========================================
-- TABLA PARA COMPARACIONES
-- =========================================

-- Crear tabla para almacenar comparaciones de investigaciones
CREATE TABLE IF NOT EXISTS public.comparaciones_sesiones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id uuid REFERENCES public.cursos(id) ON DELETE CASCADE,
    numero_sesion integer NOT NULL,
    investigacion_id uuid REFERENCES public.investigaciones_sesiones(id) ON DELETE CASCADE,
    documento1_url text, -- URL del primer documento subido
    documento1_nombre text, -- Nombre del primer documento
    documento2_url text, -- URL del segundo documento subido  
    documento2_nombre text, -- Nombre del segundo documento
    resultado_comparacion text, -- Resultado de la comparación generado por IA
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completada', 'error')),
    fecha_comparacion timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================
-- TABLA PARA ACTIVIDADES
-- =========================================

-- Crear tabla para almacenar actividades propuestas por IA
CREATE TABLE IF NOT EXISTS public.actividades_sesiones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id uuid REFERENCES public.cursos(id) ON DELETE CASCADE,
    numero_sesion integer NOT NULL,
    texto_actividad_original text, -- Texto original de "actividades_aprendizaje" del JSON
    propuesta_actividad text, -- Propuesta de actividad generada por IA
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completada', 'error')),
    fecha_creacion timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================
-- POLÍTICAS RLS PARA COMPARACIONES
-- =========================================

-- Habilitar RLS para comparaciones
ALTER TABLE public.comparaciones_sesiones ENABLE ROW LEVEL SECURITY;

-- Crear políticas para comparaciones
CREATE POLICY "Enable read access for all users on comparaciones" ON public.comparaciones_sesiones
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users on comparaciones" ON public.comparaciones_sesiones
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users on comparaciones" ON public.comparaciones_sesiones
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users on comparaciones" ON public.comparaciones_sesiones
    FOR DELETE USING (true);

-- =========================================
-- POLÍTICAS RLS PARA ACTIVIDADES
-- =========================================

-- Habilitar RLS para actividades
ALTER TABLE public.actividades_sesiones ENABLE ROW LEVEL SECURITY;

-- Crear políticas para actividades
CREATE POLICY "Enable read access for all users on actividades" ON public.actividades_sesiones
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users on actividades" ON public.actividades_sesiones
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users on actividades" ON public.actividades_sesiones
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users on actividades" ON public.actividades_sesiones
    FOR DELETE USING (true);

-- =========================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- =========================================

-- Índices para comparaciones
CREATE INDEX IF NOT EXISTS idx_comparaciones_curso_id ON public.comparaciones_sesiones(curso_id);
CREATE INDEX IF NOT EXISTS idx_comparaciones_sesion ON public.comparaciones_sesiones(numero_sesion);
CREATE INDEX IF NOT EXISTS idx_comparaciones_investigacion ON public.comparaciones_sesiones(investigacion_id);
CREATE INDEX IF NOT EXISTS idx_comparaciones_estado ON public.comparaciones_sesiones(estado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_comparaciones_curso_sesion 
ON public.comparaciones_sesiones(curso_id, numero_sesion);

-- Índices para actividades
CREATE INDEX IF NOT EXISTS idx_actividades_curso_id ON public.actividades_sesiones(curso_id);
CREATE INDEX IF NOT EXISTS idx_actividades_sesion ON public.actividades_sesiones(numero_sesion);
CREATE INDEX IF NOT EXISTS idx_actividades_estado ON public.actividades_sesiones(estado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_actividades_curso_sesion 
ON public.actividades_sesiones(curso_id, numero_sesion);

-- =========================================
-- TRIGGERS PARA UPDATED_AT
-- =========================================

-- Trigger para comparaciones
CREATE TRIGGER update_comparaciones_sesiones_updated_at
    BEFORE UPDATE ON public.comparaciones_sesiones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actividades
CREATE TRIGGER update_actividades_sesiones_updated_at
    BEFORE UPDATE ON public.actividades_sesiones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =========================================

-- Comentarios para tabla de comparaciones
COMMENT ON TABLE public.comparaciones_sesiones IS 'Tabla para almacenar comparaciones entre investigaciones y documentos externos';
COMMENT ON COLUMN public.comparaciones_sesiones.investigacion_id IS 'Referencia a la investigación que se está comparando';
COMMENT ON COLUMN public.comparaciones_sesiones.documento1_url IS 'URL del primer documento subido para comparación';
COMMENT ON COLUMN public.comparaciones_sesiones.documento2_url IS 'URL del segundo documento subido para comparación';
COMMENT ON COLUMN public.comparaciones_sesiones.resultado_comparacion IS 'Análisis comparativo generado por IA';

-- Comentarios para tabla de actividades
COMMENT ON TABLE public.actividades_sesiones IS 'Tabla para almacenar actividades virtuales propuestas por IA';
COMMENT ON COLUMN public.actividades_sesiones.texto_actividad_original IS 'Texto original de actividades_aprendizaje del JSON de sesiones';
COMMENT ON COLUMN public.actividades_sesiones.propuesta_actividad IS 'Propuesta de actividad virtual generada por IA';

-- =========================================
-- VERIFICACIÓN DE TABLAS CREADAS
-- =========================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('comparaciones_sesiones', 'actividades_sesiones')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position; 