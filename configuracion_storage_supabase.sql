-- =========================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- =========================================
-- Ejecutar estos comandos en la consola SQL de Supabase

-- =========================================
-- 1. CREAR BUCKET PARA DOCUMENTOS
-- =========================================

-- Crear bucket público para documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documentos',
    'documentos', 
    true,
    10485760, -- 10MB límite por archivo
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- =========================================
-- 2. CONFIGURAR POLÍTICAS RLS PARA STORAGE
-- =========================================

-- Política para permitir subir archivos a cualquier usuario autenticado
CREATE POLICY "Permitir subida de documentos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documentos'
);

-- Política para permitir leer archivos a cualquier usuario
CREATE POLICY "Permitir lectura de documentos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documentos'
);

-- Política para permitir actualizar archivos
CREATE POLICY "Permitir actualización de documentos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'documentos'
);

-- Política para permitir eliminar archivos
CREATE POLICY "Permitir eliminación de documentos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documentos'
);

-- =========================================
-- 3. VERIFICAR CONFIGURACIÓN
-- =========================================

-- Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE name = 'documentos';

-- Verificar las políticas
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- =========================================
-- 4. ALTERNATIVA: CREAR BUCKET DESDE INTERFAZ
-- =========================================

/*
Si prefieres crear el bucket desde la interfaz de Supabase:

1. Ve a Storage en el dashboard de Supabase
2. Haz clic en "New bucket"
3. Nombre: documentos
4. Configuración:
   - Public bucket: ON (habilitado)
   - File size limit: 10 MB
   - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

Las políticas RLS se pueden crear desde la interfaz también:
- Ve a Storage > documentos > Configuration > Policies
- Añade las políticas necesarias para INSERT, SELECT, UPDATE, DELETE
*/

-- =========================================
-- 5. COMANDOS ADICIONALES (SI ES NECESARIO)
-- =========================================

-- Si necesitas eliminar el bucket y empezar de nuevo:
-- DELETE FROM storage.objects WHERE bucket_id = 'documentos';
-- DELETE FROM storage.buckets WHERE id = 'documentos';

-- Si necesitas cambiar configuración del bucket:
-- UPDATE storage.buckets 
-- SET public = true, file_size_limit = 10485760
-- WHERE id = 'documentos';

-- =========================================
-- 6. ESTRUCTURA DE DIRECTORIOS SUGERIDA
-- =========================================

/*
La aplicación creará automáticamente esta estructura de directorios:

documentos/
├── comparaciones/
│   ├── [curso_id]/
│   │   ├── [numero_sesion]/
│   │   │   ├── doc1_[timestamp]_[nombre_archivo].pdf
│   │   │   └── doc2_[timestamp]_[nombre_archivo].pdf
│   │   └── ...
│   └── ...
└── otros/ (para futuros usos)
*/ 