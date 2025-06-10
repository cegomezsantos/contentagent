# 🚀 Guía de Despliegue: GitHub + Netlify

## 📋 Preparación Previa

### ✅ Archivos ya configurados:
- `.gitignore` actualizado (excluye archivos sensibles)
- `README.md` completo y profesional
- `netlify.toml` configurado para Next.js
- Variables de entorno protegidas

## 🔄 Paso 1: Subir a GitHub

### 1. Verificar archivos a subir
```bash
git status
```

### 2. Agregar todos los cambios
```bash
git add .
```

### 3. Hacer commit
```bash
git commit -m "feat: Sistema completo de gestión educativa con IA

- ✅ Gestión de sílabos con análisis IA
- ✅ Investigación automatizada (DeepSeek + Perplexity)  
- ✅ Generación de estructuras PPT
- ✅ Sistema de revisores completo
- ✅ Generación de actividades virtuales
- ✅ Interfaz completa y funcional"
```

### 4. Subir a GitHub
```bash
git push origin main
```

## 🌐 Paso 2: Configurar Netlify

### 1. Ir a Netlify
- Visita: https://app.netlify.com/
- Iniciar sesión o crear cuenta

### 2. Conectar repositorio
- Clic en **"New site from Git"**
- Seleccionar **GitHub**
- Autorizar conexión
- Seleccionar tu repositorio `contentagent`

### 3. Configuración de Build
**Netlify detectará automáticamente la configuración desde `netlify.toml`:**
- ✅ **Build command**: `npm run build`
- ✅ **Publish directory**: `.next`
- ✅ **Node version**: `18`

### 4. Variables de Entorno
En **Site settings > Environment variables**, agregar:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
DEEPSEEK_API_KEY=tu_api_key_de_deepseek
PERPLEXITY_API_KEY=tu_api_key_de_perplexity
```

### 5. Deploy inicial
- Clic en **"Deploy site"**
- Esperar a que termine el build (5-10 minutos)

## 🔧 Paso 3: Configuración Post-Deploy

### 1. Dominio personalizado (opcional)
- En **Site settings > Domain management**
- Agregar dominio personalizado
- Configurar DNS según las instrucciones

### 2. HTTPS automático
- Netlify configurará HTTPS automáticamente
- ✅ Certificado SSL gratuito incluido

### 3. Configurar redirects para Next.js
**Ya configurado en `netlify.toml`:**
- ✅ Redirecciones automáticas
- ✅ Headers de seguridad
- ✅ Cache optimizado

## 🧪 Paso 4: Verificar Deploy

### 1. Probar URL de Netlify
- Acceder a la URL proporcionada por Netlify
- Formato: `https://nombre-aleatorio.netlify.app`

### 2. Verificar funcionalidades:
- [ ] ✅ Página carga correctamente
- [ ] ✅ Conexión a Supabase funciona
- [ ] ✅ Subida de archivos funciona
- [ ] ✅ APIs de IA responden correctamente
- [ ] ✅ Todas las pestañas cargan

### 3. Revisar logs si hay errores:
- En Netlify: **Site settings > Functions > Function logs**
- Para errores de build: **Deploys > [Deploy específico] > Deploy log**

## 🔄 Paso 5: Deploy Automático

### Configuración automática ya activa:
- ✅ Cada `git push` al branch `main` dispara deploy automático
- ✅ Preview deploys para pull requests
- ✅ Rollback automático si falla el build

## 🚨 Solución de Problemas Comunes

### Error: "Build failed"
```bash
# Verificar localmente:
npm run build

# Si falla, revisar:
npm run lint
npm run type-check
```

### Error: "Environment variables not found"
- Verificar que todas las variables estén en Netlify
- Usar nombres exactos (case-sensitive)
- No incluir comillas en los valores

### Error: "API routes not working"
- Next.js en Netlify requiere el plugin `@netlify/plugin-nextjs`
- Ya incluido en `netlify.toml`

### Error: "Supabase connection failed"
- Verificar URLs de Supabase
- Revisar políticas RLS en producción
- Verificar que las tablas existen

## 📊 Métricas y Monitoreo

### Netlify Analytics (gratis):
- Visitas y page views
- Performance metrics
- Error tracking

### Configuraciones adicionales:
- **Forms**: Para contacto (si lo necesitas)
- **Identity**: Para auth adicional (opcional)
- **Large Media**: Para archivos grandes (si lo necesitas)

## 🔗 URLs Importantes

- **Netlify Dashboard**: https://app.netlify.com/
- **GitHub Repo**: Tu repositorio
- **Site URL**: La URL de tu sitio desplegado
- **Supabase Dashboard**: https://supabase.com/dashboard

## ✅ Checklist Final

- [ ] ✅ Código subido a GitHub
- [ ] ✅ Netlify conectado al repo
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Build exitoso
- [ ] ✅ Site desplegado y funcional
- [ ] ✅ Todas las funcionalidades probadas
- [ ] ✅ DNS configurado (si usas dominio propio)

---

**🎉 ¡Tu aplicación está en producción!**

**Próximos pasos opcionales:**
- Configurar dominio personalizado
- Configurar monitoreo avanzado
- Configurar backups de Supabase
- Implementar CI/CD adicional 