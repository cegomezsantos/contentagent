'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import MarkdownRenderer from '../MarkdownRenderer';
import { CursoConRevision, ActividadSesion } from '../../types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ActividadesStepProps {
  cursos: CursoConRevision[];
  onRefresh?: () => Promise<void>;
}

interface SesionConActividad {
  numero_sesion: number;
  tema_principal: string;
  actividades_aprendizaje?: string;
  actividad?: ActividadSesion;
}

export default function ActividadesStep({ cursos, onRefresh }: ActividadesStepProps) {
  const [sesionesData, setSesionesData] = useState<{ [cursoId: string]: SesionConActividad[] }>({});
  const [cursoExpandido, setCursoExpandido] = useState<string | null>(null);
  const [generando, setGenerando] = useState<string | null>(null);
  const [actividadMostrada, setActividadMostrada] = useState<string | null>(null);

  useEffect(() => {
    cargarSesionesConActividades();
  }, [cursos]);

  const cargarSesionesConActividades = async () => {
    try {
      console.log('🎯 Cargando sesiones con actividades:', cursos);

      // Obtener todas las actividades existentes
      const { data: actividades, error } = await supabase
        .from('actividades_sesiones')
        .select('*');

      if (error) {
        console.error('Error cargando actividades:', error);
        return;
      }

      const sesionesMap: { [cursoId: string]: SesionConActividad[] } = {};

      for (const curso of cursos) {
        // Solo mostrar cursos que tienen revisión aprobada
        if (curso.revision?.estado === 'aprobado') {
          try {
            // Obtener el JSON de sesiones del curso
            const { data: revision, error: revisionError } = await supabase
              .from('revision_silabus')
              .select('json_sesiones')
              .eq('curso_id', curso.id)
              .single();

            if (revisionError || !revision?.json_sesiones) {
              console.warn(`No se encontró JSON de sesiones para curso ${curso.nombre_curso}`);
              continue;
            }

            const jsonSesiones = revision.json_sesiones as any;
            console.log(`🎯 JSON sesiones para ${curso.nombre_curso}:`, jsonSesiones);
            
            if (jsonSesiones.sesiones && Array.isArray(jsonSesiones.sesiones)) {
              const sesiones: SesionConActividad[] = jsonSesiones.sesiones.map((sesion: any) => {
                                 const actividad = actividades?.find(
                   (act: any) => act.curso_id === curso.id && act.numero_sesion === sesion.numero_sesion
                 );
                
                // Extraer actividades de aprendizaje del JSON
                let actividadesTexto = '';
                if (sesion.actividades_aprendizaje) {
                  if (Array.isArray(sesion.actividades_aprendizaje)) {
                    actividadesTexto = sesion.actividades_aprendizaje.join('\n• ');
                    actividadesTexto = '• ' + actividadesTexto;
                  } else {
                    actividadesTexto = String(sesion.actividades_aprendizaje);
                  }
                }
                
                return {
                  numero_sesion: sesion.numero_sesion,
                  tema_principal: sesion.tema_principal || `Sesión ${sesion.numero_sesion}`,
                  actividades_aprendizaje: actividadesTexto,
                  actividad
                };
              });

              console.log(`🎯 Sesiones procesadas para ${curso.nombre_curso}:`, sesiones);
              sesionesMap[curso.id!] = sesiones.sort((a, b) => a.numero_sesion - b.numero_sesion);
            }
          } catch (error) {
            console.error(`Error procesando curso ${curso.nombre_curso}:`, error);
          }
        }
      }

      console.log('🎯 Mapa final de sesiones:', sesionesMap);
      setSesionesData(sesionesMap);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las actividades');
    }
  };

  const toggleCurso = (cursoId: string) => {
    setCursoExpandido(cursoExpandido === cursoId ? null : cursoId);
  };

  const generarActividad = async (curso: CursoConRevision, sesion: SesionConActividad) => {
    const actividadKey = `${curso.id}-${sesion.numero_sesion}`;
    setGenerando(actividadKey);

    try {
      const prompt = `Eres un experto diseñador instruccional especializado en educación virtual universitaria. Tu tarea es proponer una actividad de aprendizaje innovadora y efectiva para una clase completamente virtual.

**INFORMACIÓN BASE:**

**CURSO:** ${curso.nombre_curso}
**CÓDIGO:** ${curso.codigo}
**SESIÓN:** ${sesion.numero_sesion}
**TEMA:** ${sesion.tema_principal}

**ACTIVIDADES DE APRENDIZAJE ORIGINALES:**
${sesion.actividades_aprendizaje || 'No se especificaron actividades específicas'}

**CONTEXTO EDUCATIVO:**
- Modalidad: 100% VIRTUAL
- Nivel: Universitario
- Plataforma: Entorno virtual de aprendizaje
- Duración: Una sesión académica

**INSTRUCCIONES PARA EL DISEÑO:**

Diseña una actividad de aprendizaje virtual innovadora que sea:
1. **INTERACTIVA:** Que genere participación activa del estudiante
2. **PRÁCTICA:** Con aplicación real del conocimiento
3. **COLABORATIVA:** Que fomente el trabajo en equipo virtual
4. **EVALUABLE:** Con criterios claros de evaluación
5. **TECNOLÓGICA:** Que aproveche herramientas digitales

**ESTRUCTURA OBLIGATORIA DE LA PROPUESTA:**

# ACTIVIDAD VIRTUAL: ${sesion.tema_principal}

## 1. INFORMACIÓN GENERAL
- **Nombre de la actividad:** [Título creativo y descriptivo]
- **Duración:** [Tiempo estimado]
- **Modalidad:** Virtual sincrónica/asincrónica
- **Nivel de dificultad:** [Básico/Intermedio/Avanzado]

## 2. OBJETIVOS DE APRENDIZAJE
- **Objetivo principal:** 
- **Objetivos específicos:**
  - Objetivo 1
  - Objetivo 2
  - Objetivo 3

## 3. DESCRIPCIÓN DE LA ACTIVIDAD

### 3.1 Introducción y Contexto
[Breve introducción del problema o situación a resolver]

### 3.2 Desarrollo de la Actividad
[Paso a paso de lo que deben hacer los estudiantes]

### 3.3 Herramientas Digitales Requeridas
- **Plataforma principal:** [Zoom, Teams, Canvas, etc.]
- **Herramientas complementarias:** [Miro, Padlet, Kahoot, etc.]
- **Recursos necesarios:** [Videos, documentos, simuladores, etc.]

## 4. METODOLOGÍA

### 4.1 Fase 1: Preparación Individual (X minutos)
[Actividades previas que cada estudiante debe realizar]

### 4.2 Fase 2: Trabajo Colaborativo (X minutos)
[Actividades en grupos pequeños usando breakout rooms]

### 4.3 Fase 3: Plenaria y Síntesis (X minutos)
[Presentación y discusión grupal]

## 5. RECURSOS Y MATERIALES
- **Recursos digitales:**
  - [Lista de recursos online]
- **Documentos de apoyo:**
  - [PDFs, videos, artículos]
- **Plantillas:**
  - [Formatos de entrega]

## 6. INSTRUCCIONES PARA ESTUDIANTES

### 6.1 Antes de la Clase
- [ ] Revisar material previo
- [ ] Instalar herramientas necesarias
- [ ] Completar pre-actividad

### 6.2 Durante la Clase
- [ ] Participar en actividad principal
- [ ] Colaborar en grupos virtuales
- [ ] Entregar productos solicitados

### 6.3 Después de la Clase
- [ ] Completar reflexión individual
- [ ] Subir evidencias al campus virtual

## 7. EVALUACIÓN

### 7.1 Criterios de Evaluación
| Criterio | Peso | Descripción |
|----------|------|-------------|
| Participación | X% | Nivel de participación en actividades |
| Calidad del trabajo | X% | Coherencia y profundidad del análisis |
| Colaboración | X% | Efectividad en trabajo en equipo |
| Creatividad | X% | Originalidad en las propuestas |

### 7.2 Instrumentos de Evaluación
- **Rúbrica:** [Descripción de niveles de logro]
- **Autoevaluación:** [Reflexión personal]
- **Coevaluación:** [Evaluación entre pares]

## 8. ADAPTACIONES Y ALTERNATIVAS

### 8.1 Para Estudiantes con Dificultades Técnicas
[Alternativas para problemas de conectividad]

### 8.2 Para Estudiantes Avanzados
[Actividades de extensión o profundización]

## 9. SEGUIMIENTO Y RETROALIMENTACIÓN
- **Durante la actividad:** [Monitoreo en tiempo real]
- **Posterior:** [Feedback individual y grupal]
- **Mejora continua:** [Ajustes para futuras sesiones]

## 10. RECURSOS ADICIONALES
- **Para el docente:** [Guías, tips, troubleshooting]
- **Para estudiantes:** [Tutoriales, FAQ, soporte técnico]

**NOTA:** La actividad debe ser innovadora, motivadora y aprovechar al máximo las ventajas del entorno virtual para crear una experiencia de aprendizaje memorable y efectiva.`;

      // Llamar a la API de DeepSeek
      const response = await fetch('/api/deepseek-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
      }

      const data = await response.json();
      const propuestaActividad = data.result;

      // Guardar en la base de datos
      const { error } = await supabase
        .from('actividades_sesiones')
        .upsert({
          curso_id: curso.id,
          numero_sesion: sesion.numero_sesion,
          texto_actividad_original: sesion.actividades_aprendizaje,
          propuesta_actividad: propuestaActividad,
          estado: 'completada'
        });

      if (error) {
        console.error('Error guardando actividad:', error);
        toast.error('Error al guardar la actividad');
        return;
      }

      toast.success('🎯 Actividad virtual generada exitosamente');
      
      // Recargar datos
      await cargarSesionesConActividades();
      
      // Recargar cursos principales si la función está disponible
      if (onRefresh) {
        await onRefresh();
      }

    } catch (error) {
      console.error('Error en generación de actividad:', error);
      toast.error(`Error al generar la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setGenerando(null);
    }
  };

  const mostrarActividad = (actividad: ActividadSesion) => {
    setActividadMostrada(actividad.propuesta_actividad || '');
  };

  // Filtrar solo cursos aprobados con sesiones que tengan actividades de aprendizaje
  const cursosConActividades = cursos.filter(curso => 
    curso.revision?.estado === 'aprobado' && 
    sesionesData[curso.id!]?.some(sesion => sesion.actividades_aprendizaje)
  );

  if (cursosConActividades.length === 0) {
    return (
      <div className="py-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Actividades Virtuales</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              No hay cursos con actividades de aprendizaje disponibles.
            </div>
            <p className="text-sm text-gray-400">
              Primero debes revisar y aprobar sílabos que contengan información de actividades de aprendizaje.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Actividades Virtuales</h2>
      
      {/* Modal para mostrar actividad */}
      {actividadMostrada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">🎯 Propuesta de Actividad Virtual</h3>
              <button
                onClick={() => setActividadMostrada(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <MarkdownRenderer content={actividadMostrada} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-8">
          {cursosConActividades.map((curso) => {
            const sesiones = sesionesData[curso.id!] || [];
            const sesionesConActividades = sesiones.filter(s => s.actividades_aprendizaje);
            
            return (
              <div key={curso.id} className="border rounded-lg p-6 bg-gray-50">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{curso.nombre_curso}</h3>
                    <button
                      type="button"
                      onClick={() => toggleCurso(curso.id!)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {cursoExpandido === curso.id ? '🎯 Ocultar Sesiones' : '🎯 Generar Actividades'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Código: {curso.codigo}</span>
                    <span>Cuenta: {curso.cuenta}</span>
                    <span>Versión: {curso.version}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Con Actividades de Aprendizaje
                    </span>
                  </div>
                </div>
                
                {cursoExpandido === curso.id && (
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Sesiones con Actividades</h4>
                    {sesionesConActividades.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sesionesConActividades.map((sesion) => {
                          const actividadKey = `${curso.id}-${sesion.numero_sesion}`;
                          const estaGenerando = generando === actividadKey;
                          
                          return (
                            <div key={sesion.numero_sesion} className="bg-white border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">Sesión {sesion.numero_sesion}</h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  sesion.actividad 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {sesion.actividad ? 'Completada' : 'Pendiente'}
                                </span>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Tema de la Sesión
                                  </label>
                                  <div className="text-sm text-gray-800 mb-2">
                                    {sesion.tema_principal}
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Actividades de Aprendizaje (Originales)
                                  </label>
                                  <div className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded min-h-[80px] text-black-custom">
                                    <pre className="whitespace-pre-wrap text-black font-sans">
                                      {sesion.actividades_aprendizaje}
                                    </pre>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => generarActividad(curso, sesion)}
                                    disabled={estaGenerando}
                                    className="flex-1 py-2 px-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {estaGenerando ? '🔄 Generando...' : '🎯 Generar Actividad'}
                                  </button>
                                  
                                  {sesion.actividad && (
                                    <button
                                      type="button"
                                      onClick={() => mostrarActividad(sesion.actividad!)}
                                      className="py-2 px-3 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    >
                                      👁️ Ver
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No se encontraron actividades de aprendizaje para este curso.</p>
                        <p className="text-sm mt-2">El JSON del curso debe contener la clave "actividades_aprendizaje" en las sesiones.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 