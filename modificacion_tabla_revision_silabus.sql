-- Script para modificar la tabla revision_silabus
-- Agregar nuevas columnas para almacenar informe completo y JSON de sesiones

-- Agregar columnas para almacenar el contenido del informe completo y JSON de sesiones
ALTER TABLE public.revision_silabus 
ADD COLUMN IF NOT EXISTS informe_completo TEXT,
ADD COLUMN IF NOT EXISTS json_sesiones JSONB;

-- Crear índice para búsquedas eficientes en el JSON de sesiones
CREATE INDEX IF NOT EXISTS idx_revision_silabus_json_sesiones 
ON public.revision_silabus USING gin (json_sesiones);

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN public.revision_silabus.informe_completo IS 'Informe completo generado por IA en formato markdown/texto';
COMMENT ON COLUMN public.revision_silabus.json_sesiones IS 'Estructura JSON con las sesiones y temas extraídos del sílabo';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'revision_silabus' 
AND table_schema = 'public'
ORDER BY ordinal_position; 