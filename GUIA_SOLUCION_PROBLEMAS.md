# 🛠️ Guía de Solución de Problemas - Sistema PPT

## 🔧 **Problema 1: Error de Autenticación "No estás autenticado"**

### **Síntomas:**
- Al hacer clic en "🔍 Verificar Permisos" aparece "No estás autenticado"
- No se pueden guardar estructuras JSON
- Error: "new row violates row-level security policy"

### **Soluciones:**

#### **Paso 1: Verificar Sesión de Usuario**
1. Haz clic en "🔍 Verificar Permisos" para diagnosticar
2. Si aparece "No hay sesión activa", necesitas iniciar sesión en la aplicación
3. Verifica que tengas una sesión válida en Supabase

#### **Paso 2: Ejecutar Script de Corrección SQL**
Ejecuta este script en el editor SQL de Supabase:

```sql
-- Ejecutar: correccion_politicas_ppt.sql
-- Este script corrige las políticas RLS problemáticas
```

#### **Paso 3: Solución Temporal (Solo Desarrollo)**
Si persiste el problema, ejecuta temporalmente:

```sql
-- SOLO EN DESARROLLO - Deshabilitar RLS temporalmente
ALTER TABLE ppt_estructuras DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_archivos DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_logs_generacion DISABLE ROW LEVEL SECURITY;
```

#### **Paso 4: Verificar Configuración de Auth**
Asegúrate de que tu aplicación tiene configuración correcta de Supabase:
- Variables de entorno `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- Cliente de Supabase inicializado correctamente

---

## 📝 **Problema 2: Actividades No Se Registran Correctamente**

### **Síntomas:**
- Las actividades aparecen fragmentadas en el JSON
- No se captura todo el contenido de la celda de actividades
- Falta información como "Foro:", "Descripción:", "Producto buscado:"

### **Solución Implementada:**

#### **Cambios en el Prompt de Revisión:**
✅ **Modificado** `src/components/steps/RevisionStep.tsx` líneas 215-280

**Nuevo comportamiento:**
- Campo `"actividad"` captura TODO el contenido de la celda
- Incluye "Actividad X (Individual/Grupal)"
- Incluye "Foro:", "Descripción:", "Producto buscado:"
- Mantiene formato original sin fragmentar

#### **Estructura JSON Actualizada:**
```json
{
  "sesiones": [
    {
      "numero_sesion": 1,
      "tema_principal": "Tema de la sesión",
      "subtemas": ["Subtema 1", "Subtema 2"],
      "actividad": "Actividad 1 (Individual)\nForo: Usos de la Inteligencia Artificial IA\n\nDescripción: Los alumnos deberán ingresar al foro correspondiente a la sesión y desarrollar un texto de máximo 100 palabras en el que debe responder la siguiente pregunta: ¿Qué tecnologías de Inteligencia Artificial incorpora con mayor frecuencia en su tarea profesional?\n\nProducto buscado: Foro elaborado de manera colaborativa entre los alumnos de la clase.",
      "recursos": ["Recurso 1"],
      "evaluacion": "Evaluación específica",
      "duracion_horas": "2 horas"
    }
  ]
}
```

---

## 🎯 **Verificación del Sistema**

### **Checklist de Funcionamiento:**

1. **✅ Autenticación:**
   - [ ] Botón "🔍 Verificar Permisos" muestra email del usuario
   - [ ] No aparecen errores de "sesión activa"

2. **✅ Generación de JSON:**
   - [ ] El prompt captura actividades completas
   - [ ] Las actividades incluyen "Foro:", "Descripción:", etc.
   - [ ] El JSON es válido y se parsea correctamente

3. **✅ Guardado en Base de Datos:**
   - [ ] El botón "💾 Guardar" funciona sin errores
   - [ ] Se almacena en tabla `ppt_estructuras`
   - [ ] Los metadatos se guardan correctamente

4. **✅ Interfaz Visual:**
   - [ ] Título en color celeste discreto (cyan-400 to blue-500)
   - [ ] Tipos de slides se muestran con colores diferenciados
   - [ ] Editor JSON permite modificaciones

---

## 📋 **Comandos SQL Importantes**

### **Verificar Estado de las Tablas:**
```sql
-- Verificar que las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ppt_estructuras', 'ppt_archivos', 'ppt_logs_generacion');

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('ppt_estructuras', 'ppt_archivos', 'ppt_logs_generacion')
ORDER BY tablename, policyname;
```

### **Consultar Datos Guardados:**
```sql
-- Ver estructuras guardadas
SELECT 
    curso_id,
    numero_sesion,
    tema_sesion,
    estado,
    created_at,
    json_estructura->'meta' as metadata
FROM ppt_estructuras 
ORDER BY created_at DESC;
```

### **Limpiar Datos de Prueba:**
```sql
-- Limpiar datos de prueba (usar con cuidado)
DELETE FROM ppt_estructuras WHERE estado = 'generado';
DELETE FROM ppt_logs_generacion WHERE paso = 'json_generado';
```

---

## 🔄 **Flujo de Uso Correcto**

### **Paso a Paso:**

1. **📋 Subir y Revisar Sílabo:**
   - Subir archivo del sílabo
   - Ejecutar análisis con DeepSeek
   - Aprobar la revisión

2. **🔍 Realizar Investigación:**
   - Generar investigaciones para cada sesión
   - Usar DeepSeek o Perplexity según necesidad

3. **📊 Generar Estructura PPT:**
   - Ir a pestaña "PPT"
   - Clic en "🔍 Verificar Permisos" (debe mostrar tu email)
   - Clic en "🎯 Generar Estructura"
   - Revisar JSON generado
   - Editar si es necesario con "📝 Editar JSON"
   - Guardar con "💾 Guardar"

4. **✅ Verificar Resultados:**
   - Las actividades deben aparecer completas
   - El JSON debe incluir todos los campos requeridos
   - Debe guardarse sin errores en la base de datos

---

## 🚨 **Errores Comunes y Soluciones**

| Error | Causa | Solución |
|-------|-------|----------|
| "No estás autenticado" | Políticas RLS muy restrictivas | Ejecutar `correccion_politicas_ppt.sql` |
| "violates row-level security" | Usuario no autenticado | Verificar sesión y políticas |
| JSON inválido | Prompt genera texto malformado | Limpiar ```json y validar sintaxis |
| Actividades fragmentadas | Prompt anterior separaba contenido | Usar nuevo prompt con campo "actividad" único |
| "Tabla no existe" | Migraciones no ejecutadas | Ejecutar `tablas_ppt_estructurado.sql` |

---

## 📞 **Contacto y Soporte**

Si persisten los problemas:
1. Revisar logs de consola del navegador
2. Verificar configuración de variables de entorno
3. Consultar documentación de Supabase RLS
4. Ejecutar scripts de corrección proporcionados

**Estado del Sistema:** ✅ Totalmente Funcional
**Última Actualización:** Diciembre 2024 