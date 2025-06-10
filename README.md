# 📚 Sistema de Gestión de Contenido Educativo

Sistema integral para la gestión, revisión y generación de contenido educativo universitario con integración de IA.

## 🚀 Características Principales

### 📋 **Gestión de Sílabos**
- Subida y validación de archivos de sílabos
- Renombrado automático con formato estandarizado
- Análisis automatizado con IA (DeepSeek)
- Sistema de revisión y aprobación

### 🔍 **Investigación Automatizada**
- Generación de investigaciones por sesión
- Dual AI: DeepSeek y Perplexity
- Búsqueda de expertos, empresas y casos reales
- Almacenamiento estructurado de resultados

### 📊 **Generación de Presentaciones PPT**
- Estructuras JSON detalladas para PPT
- 8 tipos de slides: portada, índice, subtemas, texto+imagen, dos columnas, solo imagen, solo texto, conclusión
- Captura completa de actividades y evaluaciones
- Editor JSON integrado

### 👥 **Sistema de Revisores**
- Gestión de revisores con datos completos
- Estados de revisión: EN PROCESO, APROBADO, APROBADO CON OBSERVACIONES, RECHAZADO
- Seguimiento de deadlines y status

### 📈 **Generación de Actividades**
- Actividades virtuales innovadoras
- Enfoque en metodología "Aprende Haciendo"
- Integración con investigaciones realizadas

### 📊 **Comparación y Gráficas**
- Comparación entre cursos
- Gráficas de progreso (en construcción)

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **IA**: DeepSeek API, Perplexity API
- **UI**: React Hot Toast, Heroicons

## 📦 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone [URL_DEL_REPO]
cd contentagent
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env.local` con:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# APIs de IA
DEEPSEEK_API_KEY=tu_deepseek_api_key
PERPLEXITY_API_KEY=tu_perplexity_api_key
```

### 4. Configurar base de datos
Ejecutar en Supabase SQL Editor:
```sql
-- 1. Crear tablas principales
-- Ejecutar: supabase/migrations/20241210_add_revision_tables.sql

-- 2. Crear tablas PPT
-- Ejecutar: tablas_ppt_estructurado.sql

-- 3. Configurar políticas (si hay problemas)
-- Ejecutar: solucion_simple_ppt.sql
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

## 🚀 Despliegue en Netlify

### 1. Build del proyecto
```bash
npm run build
```

### 2. Variables de entorno en Netlify
En el dashboard de Netlify, configurar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DEEPSEEK_API_KEY`
- `PERPLEXITY_API_KEY`

### 3. Configuración de build
- **Build command**: `npm run build`
- **Publish directory**: `.next`

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── steps/              # Componentes de cada pestaña
│   │   ├── UploadStep.tsx
│   │   ├── RevisionStep.tsx
│   │   ├── InvestigacionStep.tsx
│   │   ├── PPTStep.tsx
│   │   ├── ActividadesStep.tsx
│   │   ├── RevisoresStep.tsx
│   │   └── GraficaStep.tsx
│   └── ui/                 # Componentes reutilizables
├── app/
│   ├── api/               # API Routes
│   │   ├── deepseek-research/
│   │   ├── perplexity-research/
│   │   └── generate-ppt-code/
│   └── page.tsx           # Página principal
├── lib/
│   └── supabase.ts        # Cliente de Supabase
└── types/
    └── index.ts           # Definiciones de tipos
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar versión de producción
- `npm run lint` - Linter de código
- `npm run type-check` - Verificar tipos TypeScript

## 📊 Flujo de Uso

1. **📋 Subir Sílabo** → Análisis con IA → Aprobación
2. **🔍 Investigar Sesiones** → Contenido enriquecido por IA
3. **📊 Generar PPT** → Estructuras JSON para presentaciones
4. **👥 Asignar Revisores** → Seguimiento de revisiones
5. **📈 Generar Actividades** → Actividades virtuales innovadoras

## 🆔 APIs Requeridas

### DeepSeek
- **Uso**: Análisis de sílabos, generación de estructuras PPT
- **Endpoint**: https://api.deepseek.com
- **Documentación**: https://platform.deepseek.com/docs

### Perplexity
- **Uso**: Investigaciones especializadas con búsqueda web
- **Endpoint**: https://api.perplexity.ai
- **Documentación**: https://docs.perplexity.ai

## 🔒 Seguridad

- Autenticación via Supabase Auth
- Row Level Security (RLS) en todas las tablas
- Variables de entorno para claves sensibles
- Validación de archivos subidos

## 📚 Documentación Adicional

- `CONFIGURACION.md` - Configuración detallada
- `GUIA_SOLUCION_PROBLEMAS.md` - Solución de problemas comunes
- `tablas_ppt_estructurado.sql` - Scripts de base de datos
- `solucion_simple_ppt.sql` - Solución rápida para problemas RLS

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para problemas o sugerencias:
1. Revisar `GUIA_SOLUCION_PROBLEMAS.md`
2. Crear un Issue en GitHub
3. Verificar logs de consola y errores de Supabase

---

**Estado del Proyecto**: ✅ Producción
**Última Actualización**: Diciembre 2024
