# Configuración de Variables de Entorno

## Para que funcione el análisis de IA necesitas:

1. Crear un archivo `.env.local` en la raíz del proyecto
2. Agregar tus API Keys de DeepSeek y Perplexity:

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxx
```

3. Obtener las API Keys desde:
   - DeepSeek: https://platform.deepseek.com/api_keys
   - Perplexity: https://www.perplexity.ai/settings/api

4. Reiniciar el servidor de desarrollo: `npm run dev`

## Variables completas para .env.local:

```
# API de DeepSeek para análisis de IA
DEEPSEEK_API_KEY=tu_deepseek_api_key_aqui

# API de Perplexity para investigación con información actualizada
PERPLEXITY_API_KEY=tu_perplexity_api_key_aqui

# Configuración de Supabase 
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key 
```

## Funcionalidades:

- **DeepSeek**: Análisis profundo y estructurado de temas académicos + Generación de código PPT
- **Perplexity**: Investigación con información actualizada en tiempo real y acceso a fuentes web
- **PPTGenJS**: Librería para generación automática de presentaciones PowerPoint

## Nuevas Características - Generación de PPT:

### ¿Cómo funciona?
1. **Investigación**: Primero se debe realizar una investigación del tema (usando DeepSeek o Perplexity)
2. **Generación de Código**: DeepSeek genera código JavaScript usando la librería `pptxgenjs`
3. **Creación de PPT**: El código se ejecuta automáticamente para crear un archivo PowerPoint
4. **Descarga**: El archivo se descarga automáticamente al navegador

### Características del PPT generado:
- **15-20 diapositivas** aproximadamente
- **Diseño profesional** y educativo
- **Estructura completa**: Título, índice, desarrollo, conclusiones
- **Contenido basado** en la investigación realizada
- **Nombre del archivo**: `Código-SesiónN-Tema.pptx`

### Requisitos:
- El curso debe estar **aprobado** en la sección de revisión
- La sesión debe tener **investigación completada**
- Conexión a internet para llamadas a la API
