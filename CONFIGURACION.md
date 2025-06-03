# Configuración de Variables de Entorno

## Para que funcione el análisis de IA necesitas:

1. Crear un archivo `.env.local` en la raíz del proyecto
2. Agregar tu API Key de DeepSeek:

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

3. Obtener la API Key desde: https://platform.deepseek.com/api_keys
4. Reiniciar el servidor de desarrollo: `npm run dev`

## Variables completas para .env.local:

```
# API de DeepSeek para análisis de IA
DEEPSEEK_API_KEY=tu_api_key_aqui

# Configuración de Supabase 
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key 