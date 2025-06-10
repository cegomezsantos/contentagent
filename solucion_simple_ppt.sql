-- SOLUCIÓN SIMPLE: Deshabilitar RLS temporalmente para las tablas PPT
-- Esto es para desarrollo/pruebas. En producción usar políticas específicas.

-- Verificar que las tablas existen
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✓ Existe'
        ELSE '✗ No existe'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ppt_estructuras', 'ppt_archivos', 'ppt_logs_generacion')
ORDER BY table_name;

-- Si las tablas NO existen, ejecuta primero: tablas_ppt_estructurado.sql

-- Deshabilitar RLS (Row Level Security) temporalmente
ALTER TABLE IF EXISTS ppt_estructuras DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ppt_archivos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ppt_logs_generacion DISABLE ROW LEVEL SECURITY;

-- Verificar el estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Habilitado"
FROM pg_tables 
WHERE tablename IN ('ppt_estructuras', 'ppt_archivos', 'ppt_logs_generacion')
ORDER BY tablename;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ RLS DESHABILITADO para tablas PPT';
    RAISE NOTICE '⚠️  Esto es temporal para desarrollo';
    RAISE NOTICE '🔧 Ahora prueba el botón "Probar BD PPT" en la aplicación';
END $$;

-- Para REHABILITAR RLS más tarde (cuando tengas políticas correctas):
-- ALTER TABLE ppt_estructuras ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ppt_archivos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ppt_logs_generacion ENABLE ROW LEVEL SECURITY; 