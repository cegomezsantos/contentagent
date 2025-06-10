-- Script para solucionar el problema de políticas PPT
-- Este script maneja políticas existentes y las recrea correctamente

-- PASO 1: Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Permitir SELECT en ppt_estructuras" ON ppt_estructuras;
DROP POLICY IF EXISTS "Permitir INSERT en ppt_estructuras" ON ppt_estructuras;
DROP POLICY IF EXISTS "Permitir UPDATE en ppt_estructuras" ON ppt_estructuras;
DROP POLICY IF EXISTS "Permitir DELETE en ppt_estructuras" ON ppt_estructuras;

DROP POLICY IF EXISTS "Permitir SELECT en ppt_archivos" ON ppt_archivos;
DROP POLICY IF EXISTS "Permitir INSERT en ppt_archivos" ON ppt_archivos;
DROP POLICY IF EXISTS "Permitir UPDATE en ppt_archivos" ON ppt_archivos;
DROP POLICY IF EXISTS "Permitir DELETE en ppt_archivos" ON ppt_archivos;

DROP POLICY IF EXISTS "Permitir SELECT en ppt_logs_generacion" ON ppt_logs_generacion;
DROP POLICY IF EXISTS "Permitir INSERT en ppt_logs_generacion" ON ppt_logs_generacion;

-- PASO 2: Verificar que las tablas existen
DO $$
BEGIN
    -- Verificar si las tablas existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ppt_estructuras') THEN
        RAISE NOTICE 'TABLA ppt_estructuras NO EXISTE - Ejecuta primero: tablas_ppt_estructurado.sql';
    ELSE
        RAISE NOTICE 'Tabla ppt_estructuras encontrada ✓';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ppt_archivos') THEN
        RAISE NOTICE 'TABLA ppt_archivos NO EXISTE - Ejecuta primero: tablas_ppt_estructurado.sql';
    ELSE
        RAISE NOTICE 'Tabla ppt_archivos encontrada ✓';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ppt_logs_generacion') THEN
        RAISE NOTICE 'TABLA ppt_logs_generacion NO EXISTE - Ejecuta primero: tablas_ppt_estructurado.sql';
    ELSE
        RAISE NOTICE 'Tabla ppt_logs_generacion encontrada ✓';
    END IF;
END $$;

-- PASO 3: Crear políticas más permisivas
-- Para ppt_estructuras
CREATE POLICY "ppt_estructuras_select_all" ON ppt_estructuras
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ppt_estructuras_insert_all" ON ppt_estructuras
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ppt_estructuras_update_all" ON ppt_estructuras
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "ppt_estructuras_delete_all" ON ppt_estructuras
    FOR DELETE TO authenticated USING (true);

-- Para ppt_archivos
CREATE POLICY "ppt_archivos_select_all" ON ppt_archivos
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ppt_archivos_insert_all" ON ppt_archivos
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ppt_archivos_update_all" ON ppt_archivos
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "ppt_archivos_delete_all" ON ppt_archivos
    FOR DELETE TO authenticated USING (true);

-- Para ppt_logs_generacion
CREATE POLICY "ppt_logs_select_all" ON ppt_logs_generacion
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ppt_logs_insert_all" ON ppt_logs_generacion
    FOR INSERT TO authenticated WITH CHECK (true);

-- PASO 4: Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('ppt_estructuras', 'ppt_archivos', 'ppt_logs_generacion')
ORDER BY tablename, policyname;

-- PASO 5: Probar inserción simple (opcional)
-- Descomenta las siguientes líneas para probar:
/*
INSERT INTO ppt_estructuras (
    curso_id, 
    numero_sesion, 
    tema_sesion, 
    json_estructura,
    estado
) VALUES (
    (SELECT id FROM cursos LIMIT 1), -- Usar el primer curso disponible
    999, -- Número de sesión de prueba
    'Prueba de permisos',
    '{"test": "prueba"}',
    'generado'
);

-- Limpiar prueba
DELETE FROM ppt_estructuras WHERE numero_sesion = 999;
*/

-- RESULTADO ESPERADO:
-- Las políticas deben permitir todas las operaciones para usuarios autenticados
-- No debe haber errores de RLS al guardar estructuras PPT 