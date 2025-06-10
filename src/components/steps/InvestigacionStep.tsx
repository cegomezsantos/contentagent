'use client';

import { useState, useEffect } from 'react';
import { CursoConRevision, InvestigacionSesion } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface InvestigacionStepProps {
  cursos: CursoConRevision[];
  onRefresh?: () => Promise<void>;
}

interface SesionConInvestigacion {
  numero_sesion: number;
  tema_principal: string;
  temas_completos?: string; // Para incluir temas y subtemas detallados
  investigacion?: InvestigacionSesion;
}

export default function InvestigacionStep({ cursos, onRefresh }: InvestigacionStepProps) {
  const [cursoExpandido, setCursoExpandido] = useState<string | null>(null);
  const [sesionesData, setSesionesData] = useState<{ [cursoId: string]: SesionConInvestigacion[] }>({});
  const [investigando, setInvestigando] = useState<string | null>(null); // curso_id-numero_sesion
  const [investigacionMostrada, setInvestigacionMostrada] = useState<string | null>(null);

  useEffect(() => {
    if (cursos.length > 0) {
      cargarSesionesConInvestigaciones();
    }
  }, [cursos]);

  const cargarSesionesConInvestigaciones = async () => {
    try {
      console.log('🔍 Cursos recibidos en InvestigacionStep:', cursos); // LOG para debug

      // Obtener todas las investigaciones existentes
      const { data: investigaciones, error } = await supabase
        .from('investigaciones_sesiones')
        .select('*');

      if (error) {
        console.error('Error cargando investigaciones:', error);
        return;
      }

      const sesionesMap: { [cursoId: string]: SesionConInvestigacion[] } = {};

      for (const curso of cursos) {
        console.log(`🔍 Procesando curso ${curso.nombre_curso}:`, curso.revision); // LOG para debug
        
        // Solo mostrar cursos que tienen revisión aprobada
        if (curso.revision?.estado === 'aprobado') {
          try {
            // Obtener el JSON de sesiones del curso (ya debería estar en curso.revision)
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
            console.log(`🔍 JSON sesiones para ${curso.nombre_curso}:`, jsonSesiones); // LOG para debug
            
            if (jsonSesiones.sesiones && Array.isArray(jsonSesiones.sesiones)) {
              const sesiones: SesionConInvestigacion[] = jsonSesiones.sesiones.map((sesion: any) => {
                const investigacion = investigaciones?.find(
                  inv => inv.curso_id === curso.id && inv.numero_sesion === sesion.numero_sesion
                );
                
                // Construir texto completo con temas y subtemas
                let temasCompletos = sesion.tema_principal || `Sesión ${sesion.numero_sesion}`;
                
                if (sesion.subtemas && Array.isArray(sesion.subtemas) && sesion.subtemas.length > 0) {
                  temasCompletos += '\n\nSubtemas:\n' + sesion.subtemas.map((st: string, idx: number) => `${idx + 1}. ${st}`).join('\n');
                }
                
                if (sesion.contenidos && Array.isArray(sesion.contenidos) && sesion.contenidos.length > 0) {
                  temasCompletos += '\n\nContenidos:\n' + sesion.contenidos.map((cont: string, idx: number) => `• ${cont}`).join('\n');
                }
                
                if (sesion.descripcion) {
                  temasCompletos += '\n\nDescripción:\n' + sesion.descripcion;
                }
                
                return {
                  numero_sesion: sesion.numero_sesion,
                  tema_principal: sesion.tema_principal || `Sesión ${sesion.numero_sesion}`,
                  temas_completos: temasCompletos,
                  investigacion
                };
              });

              console.log(`🔍 Sesiones procesadas para ${curso.nombre_curso}:`, sesiones); // LOG para debug
              sesionesMap[curso.id!] = sesiones;
            }
          } catch (error) {
            console.error(`Error procesando curso ${curso.nombre_curso}:`, error);
          }
        }
      }

      console.log('🔍 Mapa final de sesiones:', sesionesMap); // LOG para debug
      setSesionesData(sesionesMap);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las investigaciones');
    }
  };

  const toggleCurso = (cursoId: string) => {
    setCursoExpandido(cursoExpandido === cursoId ? null : cursoId);
  };

  const realizarInvestigacion = async (curso: CursoConRevision, sesion: SesionConInvestigacion, usarPerplexity: boolean = false) => {
    const investigacionKey = `${curso.id}-${sesion.numero_sesion}`;
    setInvestigando(investigacionKey);

    try {
      const prompt = usarPerplexity 
        ? `Como experto investigador académico especializado en educación universitaria, necesito que investigues de manera exhaustiva y detallada el siguiente tema para un curso universitario.

**TEMA A INVESTIGAR:** "${sesion.tema_principal}"

**CONTEXTO DEL CURSO:**
- Curso: ${curso.nombre_curso}
- Código: ${curso.codigo}
- Nivel: Universitario
- Sesión: ${sesion.numero_sesion}

**REQUERIMIENTOS ESPECÍFICOS:**
Proporciona información actualizada, rigurosa académicamente pero accesible para estudiantes universitarios. INCLUYE OBLIGATORIAMENTE nombres de referentes del tema, expertos reconocidos, empresas líderes, estudios importantes, investigadores destacados y ejemplos de implementación real cuando sea pertinente. La investigación debe explicar el tema y sus subtemas con detalles y ejemplos para la mejor comprensión de los estudiantes.

**ESTRUCTURA REQUERIDA:**

# INVESTIGACIÓN: ${sesion.tema_principal}

## 1. INTRODUCCIÓN Y CONCEPTOS CLAVE
- Definición clara del tema
- Importancia en el contexto del curso
- Conceptos fundamentales que los estudiantes deben conocer

## 2. DESARROLLO TEÓRICO Y REFERENTES
- Fundamentos teóricos principales
- **NOMBRES DE EXPERTOS Y REFERENTES** destacados en el área
- **INVESTIGADORES PRINCIPALES** y sus contribuciones
- Teorías y modelos actuales más relevantes
- Evolución histórica (si es pertinente)

## 3. INFORMACIÓN ACTUALIZADA Y TENDENCIAS
- Desarrollos recientes en el área (últimos 3-5 años)
- **ESTUDIOS ESPECÍFICOS** con nombres y fechas
- **EMPRESAS LÍDERES** en el sector
- Estadísticas y datos relevantes con fuentes

## 4. EJEMPLOS PRÁCTICOS Y CASOS DE ESTUDIO REALES
- **CASOS REALES DE EMPRESAS ESPECÍFICAS** (con nombres)
- **PROYECTOS DESTACADOS** y sus resultados
- Ejemplos específicos que ilustren los conceptos
- **IMPLEMENTACIONES EXITOSAS** en organizaciones conocidas

## 5. HERRAMIENTAS Y TECNOLOGÍAS
- Software y plataformas relevantes (con nombres específicos)
- **EMPRESAS TECNOLÓGICAS** que desarrollan estas herramientas
- Recursos digitales disponibles
- Innovaciones tecnológicas aplicables

## 6. DESAFÍOS Y OPORTUNIDADES ACTUALES
- Principales retos en el área
- **OPINIONES DE EXPERTOS** reconocidos
- Oportunidades futuras
- Tendencias emergentes

## 7. REFERENTES Y RECURSOS ESPECIALIZADOS
- **NOMBRES DE AUTORES Y INVESTIGADORES DESTACADOS**
- **EMPRESAS CONSULTORAS** especializadas en el tema
- **ORGANIZACIONES LÍDERES** en el sector
- Libros y publicaciones académicas recomendadas (con autores específicos)
- Sitios web especializados

## 8. SÍNTESIS Y APLICACIÓN
- Puntos clave para recordar
- **RECOMENDACIONES DE EXPERTOS**
- Relevancia práctica para los estudiantes
- Recomendaciones de estudio

**IMPORTANTE:** Menciona nombres específicos de personas, empresas, estudios, investigadores y organizaciones reales siempre que sea posible. Esto enriquecerá significativamente el contenido y proporcionará referencias concretas para los estudiantes.`
        : `Eres un experto investigador académico especializado en educación universitaria. Tu tarea es realizar una investigación exhaustiva y detallada sobre un tema específico para un curso universitario.

**INSTRUCCIONES ESPECÍFICAS:**

1. **TEMA A INVESTIGAR:** "${sesion.tema_principal}"

2. **CONTEXTO:** 
   - Curso: ${curso.nombre_curso}
   - Código: ${curso.codigo}
   - Nivel: Universitario
   - Sesión: ${sesion.numero_sesion}

3. **REQUERIMIENTOS DE LA INVESTIGACIÓN:**
   - Información ACTUALIZADA y vigente (últimos 3-5 años cuando sea relevante)
   - Profundidad académica apropiada para nivel universitario
   - Enfoque práctico y aplicable
   - Ejemplos concretos y casos de estudio
   - Referencias a fuentes confiables

4. **ESTRUCTURA OBLIGATORIA DEL INFORME:**

# INVESTIGACIÓN: ${sesion.tema_principal}

## 1. INTRODUCCIÓN
- Definición y conceptos clave
- Importancia del tema en el contexto del curso
- Objetivos de la investigación

## 2. MARCO TEÓRICO
- Fundamentos teóricos principales
- Evolución histórica del concepto (si es relevante)
- Teorías y modelos actuales

## 3. ESTADO ACTUAL
- Tendencias y desarrollos recientes
- Investigaciones y estudios actuales
- Estadísticas y datos relevantes (últimos 3 años)

## 4. APLICACIONES PRÁCTICAS
- Casos de estudio específicos
- Ejemplos de implementación
- Herramientas y metodologías

## 5. TECNOLOGÍAS Y HERRAMIENTAS
- Software y plataformas relevantes
- Recursos digitales disponibles
- Innovaciones tecnológicas aplicables

## 6. DESAFÍOS Y OPORTUNIDADES
- Principales retos actuales
- Oportunidades futuras
- Tendencias emergentes

## 7. RECURSOS PARA PROFUNDIZACIÓN
- Libros y publicaciones académicas recomendadas
- Sitios web y plataformas especializadas
- Cursos y certificaciones relevantes

## 8. CONCLUSIONES
- Síntesis de los puntos más importantes
- Relevancia para el curso
- Recomendaciones para el aprendizaje

**NOTA IMPORTANTE:** La investigación debe ser detallada, académicamente rigurosa pero accesible para estudiantes universitarios. Incluye ejemplos específicos y evita generalidades.`;

      // Llamar a la API correspondiente
      const apiEndpoint = usarPerplexity ? '/api/perplexity-research' : '/api/deepseek-analysis';
      const response = await fetch(apiEndpoint, {
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
      const contenidoInvestigacion = data.result;

      // Guardar en la base de datos
      const { error } = await supabase
        .from('investigaciones_sesiones')
        .upsert({
          curso_id: curso.id,
          numero_sesion: sesion.numero_sesion,
          tema_sesion: sesion.tema_principal,
          contenido_investigacion: contenidoInvestigacion,
          estado: 'completada'
        });

      if (error) {
        console.error('Error guardando investigación:', error);
        toast.error('Error al guardar la investigación');
        return;
      }

             toast.success('🔬 Investigación completada exitosamente');
       
       // Recargar datos
       await cargarSesionesConInvestigaciones();
       
       // Recargar cursos principales si la función está disponible
       if (onRefresh) {
         await onRefresh();
       }

    } catch (error) {
      console.error('Error en investigación:', error);
      toast.error(`Error al realizar la investigación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setInvestigando(null);
    }
  };

  const mostrarInvestigacion = (investigacion: InvestigacionSesion) => {
    setInvestigacionMostrada(investigacion.contenido_investigacion);
  };

  const borrarInvestigacion = async (curso: CursoConRevision, sesion: SesionConInvestigacion) => {
    if (!sesion.investigacion) {
      toast.error('No hay investigación para borrar');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres borrar esta investigación?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('investigaciones_sesiones')
        .delete()
        .eq('curso_id', curso.id)
        .eq('numero_sesion', sesion.numero_sesion);

      if (error) {
        console.error('Error borrando investigación:', error);
        toast.error('Error al borrar la investigación');
        return;
      }

      toast.success('Investigación borrada exitosamente');
      
      // Recargar datos
      await cargarSesionesConInvestigaciones();
      
      // Recargar cursos principales si la función está disponible
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al borrar la investigación');
    }
  };

  // Filtrar solo cursos aprobados
  const cursosAprobados = cursos.filter(curso => curso.revision?.estado === 'aprobado');

  if (cursosAprobados.length === 0) {
    return (
      <div className="py-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Investigación de Sesiones</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              No hay cursos aprobados disponibles para investigación.
            </div>
            <p className="text-sm text-gray-400">
              Primero debes revisar y aprobar sílabos en la pestaña "Revisión Sílabos".
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Investigación de Sesiones</h2>
      
      {/* Modal para mostrar investigación */}
      {investigacionMostrada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">🔬 Investigación Detallada</h3>
              <button
                onClick={() => setInvestigacionMostrada(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <MarkdownRenderer content={investigacionMostrada} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-8">
          {cursosAprobados.map((curso) => {
            const sesiones = sesionesData[curso.id!] || [];
            
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
                      {cursoExpandido === curso.id ? '🔬 Ocultar Sesiones' : '🔬 Investigar Sesiones'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Código: {curso.codigo}</span>
                    <span>Cuenta: {curso.cuenta}</span>
                    <span>Versión: {curso.version}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Aprobado
                    </span>
                  </div>
                </div>
                
                {cursoExpandido === curso.id && (
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Sesiones del Curso</h4>
                    {sesiones.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sesiones.map((sesion) => {
                          const investigacionKey = `${curso.id}-${sesion.numero_sesion}`;
                          const estaInvestigando = investigando === investigacionKey;
                          
                          return (
                            <div key={sesion.numero_sesion} className="bg-white border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">Sesión {sesion.numero_sesion}</h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  sesion.investigacion 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {sesion.investigacion ? 'Completada' : 'Pendiente'}
                                </span>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Tema de la Sesión
                                  </label>
                                  <div className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded min-h-[100px] text-black-custom">
                                    <pre className="whitespace-pre-wrap text-black font-sans">
                                      {sesion.temas_completos || sesion.tema_principal}
                                    </pre>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {/* Botones de investigación */}
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => realizarInvestigacion(curso, sesion, false)}
                                      disabled={estaInvestigando}
                                      className="flex-1 py-2 px-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {estaInvestigando ? '🔄 Investigando...' : '🔬 DeepSeek'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => realizarInvestigacion(curso, sesion, true)}
                                      disabled={estaInvestigando}
                                      className="flex-1 py-2 px-3 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {estaInvestigando ? '🔄 Investigando...' : '🌐 Perplexity'}
                                    </button>
                                  </div>
                                  
                                  {/* Botones de acciones */}
                                  {sesion.investigacion && (
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => mostrarInvestigacion(sesion.investigacion!)}
                                        className="flex-1 py-2 px-3 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                      >
                                        👁️ Ver
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => borrarInvestigacion(curso, sesion)}
                                        className="flex-1 py-2 px-3 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                      >
                                        🗑️ Borrar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No se encontraron sesiones para este curso.</p>
                        <p className="text-sm mt-2">Asegúrate de que el curso tenga una revisión aprobada con datos JSON válidos.</p>
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