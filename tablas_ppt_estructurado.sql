-- Tabla para almacenar las estructuras JSON de presentaciones
CREATE TABLE ppt_estructuras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    numero_sesion INTEGER NOT NULL,
    tema_sesion TEXT NOT NULL,
    json_estructura JSONB NOT NULL, -- Estructura JSON completa de la presentación
    meta_informacion JSONB, -- Información adicional como total de slides, tipo de contenido, etc.
    estado TEXT DEFAULT 'generado' CHECK (estado IN ('generado', 'revisado', 'aprobado', 'rechazado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Índices únicos para evitar duplicados
    UNIQUE(curso_id, numero_sesion)
);

-- Tabla para almacenar los archivos PPT generados
CREATE TABLE ppt_archivos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estructura_id UUID NOT NULL REFERENCES ppt_estructuras(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    numero_sesion INTEGER NOT NULL,
    nombre_archivo TEXT NOT NULL,
    archivo_url TEXT NOT NULL, -- URL del archivo en Supabase Storage
    archivo_tamano BIGINT, -- Tamaño del archivo en bytes
    tipo_generacion TEXT DEFAULT 'automatico' CHECK (tipo_generacion IN ('automatico', 'manual', 'editado')),
    version INTEGER DEFAULT 1, -- Para controlar versiones del mismo archivo
    notas TEXT, -- Notas adicionales sobre el archivo
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'obsoleto', 'borrador')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabla para logs de generación (opcional, para debugging)
CREATE TABLE ppt_logs_generacion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estructura_id UUID REFERENCES ppt_estructuras(id) ON DELETE CASCADE,
    archivo_id UUID REFERENCES ppt_archivos(id) ON DELETE CASCADE,
    paso TEXT NOT NULL, -- 'json_generado', 'ppt_creado', 'archivo_subido', 'error'
    detalle JSONB, -- Detalles del paso (errores, tiempos, configuración usada)
    timestamp_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID REFERENCES auth.users(id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_ppt_estructuras_curso ON ppt_estructuras(curso_id);
CREATE INDEX idx_ppt_estructuras_sesion ON ppt_estructuras(curso_id, numero_sesion);
CREATE INDEX idx_ppt_estructuras_estado ON ppt_estructuras(estado);
CREATE INDEX idx_ppt_estructuras_created ON ppt_estructuras(created_at);

CREATE INDEX idx_ppt_archivos_estructura ON ppt_archivos(estructura_id);
CREATE INDEX idx_ppt_archivos_curso ON ppt_archivos(curso_id);
CREATE INDEX idx_ppt_archivos_sesion ON ppt_archivos(curso_id, numero_sesion);
CREATE INDEX idx_ppt_archivos_estado ON ppt_archivos(estado);
CREATE INDEX idx_ppt_archivos_version ON ppt_archivos(estructura_id, version);

CREATE INDEX idx_ppt_logs_estructura ON ppt_logs_generacion(estructura_id);
CREATE INDEX idx_ppt_logs_archivo ON ppt_logs_generacion(archivo_id);
CREATE INDEX idx_ppt_logs_paso ON ppt_logs_generacion(paso);
CREATE INDEX idx_ppt_logs_timestamp ON ppt_logs_generacion(timestamp_evento);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ppt_estructuras_updated_at
    BEFORE UPDATE ON ppt_estructuras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ppt_archivos_updated_at
    BEFORE UPDATE ON ppt_archivos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configuración de RLS (Row Level Security)
ALTER TABLE ppt_estructuras ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_logs_generacion ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad básicas (ajustar según necesidades)
CREATE POLICY "Usuarios autenticados pueden ver estructuras PPT" ON ppt_estructuras
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear estructuras PPT" ON ppt_estructuras
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar estructuras PPT" ON ppt_estructuras
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver archivos PPT" ON ppt_archivos
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear archivos PPT" ON ppt_archivos
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar archivos PPT" ON ppt_archivos
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver logs" ON ppt_logs_generacion
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear logs" ON ppt_logs_generacion
    FOR INSERT TO authenticated WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE ppt_estructuras IS 'Almacena las estructuras JSON generadas por IA para presentaciones PowerPoint';
COMMENT ON TABLE ppt_archivos IS 'Almacena información de los archivos PPT generados';
COMMENT ON TABLE ppt_logs_generacion IS 'Log de eventos del proceso de generación de PPT';

COMMENT ON COLUMN ppt_estructuras.json_estructura IS 'Estructura JSON completa con slides, tipos y contenido';
COMMENT ON COLUMN ppt_estructuras.meta_informacion IS 'Información adicional como total de slides, configuración usada, etc.';
COMMENT ON COLUMN ppt_estructuras.estado IS 'Estado de la estructura: generado, revisado, aprobado, rechazado';

COMMENT ON COLUMN ppt_archivos.archivo_url IS 'URL del archivo en Supabase Storage (bucket: ppt-archivos)';
COMMENT ON COLUMN ppt_archivos.tipo_generacion IS 'Cómo fue generado: automatico (IA), manual, editado';
COMMENT ON COLUMN ppt_archivos.version IS 'Número de versión para control de cambios';
COMMENT ON COLUMN ppt_archivos.estado IS 'Estado del archivo: activo, obsoleto, borrador';

-- Ejemplo de consulta para obtener estructura con archivos
/*
SELECT 
    e.*,
    array_agg(
        json_build_object(
            'id', a.id,
            'nombre_archivo', a.nombre_archivo,
            'archivo_url', a.archivo_url,
            'version', a.version,
            'estado', a.estado,
            'created_at', a.created_at
        )
    ) as archivos
FROM ppt_estructuras e
LEFT JOIN ppt_archivos a ON e.id = a.estructura_id
WHERE e.curso_id = 'UUID_DEL_CURSO'
GROUP BY e.id;
*/ 