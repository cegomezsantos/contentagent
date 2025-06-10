-- Corregir políticas RLS para permitir operaciones en ppt_estructuras
-- Ejecutar este script en Supabase para solucionar el problema de guardado

-- Eliminar políticas existentes que pueden estar causando problemas
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver estructuras PPT" ON ppt_estructuras;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear estructuras PPT" ON ppt_estructuras;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar estructuras PPT" ON ppt_estructuras;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver archivos PPT" ON ppt_archivos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear archivos PPT" ON ppt_archivos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar archivos PPT" ON ppt_archivos;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver logs" ON ppt_logs_generacion;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear logs" ON ppt_logs_generacion;

-- Crear políticas más específicas y permisivas para ppt_estructuras
CREATE POLICY "Permitir SELECT en ppt_estructuras" ON ppt_estructuras
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Permitir INSERT en ppt_estructuras" ON ppt_estructuras
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir UPDATE en ppt_estructuras" ON ppt_estructuras
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir DELETE en ppt_estructuras" ON ppt_estructuras
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() IS NOT NULL);

-- Crear políticas para ppt_archivos
CREATE POLICY "Permitir SELECT en ppt_archivos" ON ppt_archivos
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Permitir INSERT en ppt_archivos" ON ppt_archivos
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir UPDATE en ppt_archivos" ON ppt_archivos
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir DELETE en ppt_archivos" ON ppt_archivos
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() IS NOT NULL);

-- Crear políticas para ppt_logs_generacion
CREATE POLICY "Permitir SELECT en ppt_logs_generacion" ON ppt_logs_generacion
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Permitir INSERT en ppt_logs_generacion" ON ppt_logs_generacion
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Alternativa: Si siguen los problemas, temporalmente deshabilitar RLS
-- (SOLO usar en desarrollo, no en producción)
/*
ALTER TABLE ppt_estructuras DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_archivos DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_logs_generacion DISABLE ROW LEVEL SECURITY;
*/

-- Verificar que las políticas se aplicaron correctamente
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('ppt_estructuras', 'ppt_archivos', 'ppt_logs_generacion')
ORDER BY tablename, policyname; 