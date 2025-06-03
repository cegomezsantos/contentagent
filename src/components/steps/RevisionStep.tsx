'use client';

import { useState, useEffect } from 'react';
import { CursoConRevision, RevisionSilabo, AnalisisResultado, SesionTema } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface RevisionStepProps {
  cursos: CursoConRevision[];
}

export default function RevisionStep({ cursos }: RevisionStepProps) {
  const [cursosConRevision, setCursosConRevision] = useState<CursoConRevision[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<CursoConRevision | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisResultado | null>(null);
  const [procesandoDecision, setProcesandoDecision] = useState(false);

  useEffect(() => {
    cargarCursosConRevision();
  }, [cursos]);

  const cargarCursosConRevision = async () => {
    try {
      // Obtener todas las revisiones existentes
      const { data: revisiones, error } = await supabase
        .from('revision_silabus')
        .select('*');

      if (error) {
        console.error('Error cargando revisiones:', error);
        toast.error('Error al cargar el estado de revisiones');
        return;
      }

      // Combinar cursos con sus revisiones
      const cursosConEstado = cursos.map(curso => {
        const revision = revisiones?.find(r => r.curso_id === curso.id?.toString());
        return {
          ...curso,
          revision: revision || undefined
        };
      });

      setCursosConRevision(cursosConEstado);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos');
    }
  };

  const analizarSilabo = async (curso: CursoConRevision) => {
    setCursoSeleccionado(curso);
    setAnalizando(true);
    setResultado(null);
    
    try {
      // Obtener el contenido del documento desde Supabase
      const response = await fetch(curso.archivo_url);
      const documentoTexto = await response.text();

      // Primer análisis: Revisión general del sílabo
      const promptRevision = `Rol
Actúa como un experto en diseño curricular con amplia experiencia en la elaboración y evaluación de programas de nivel superior, especializado en la metodología «Aprende Haciendo» y en la ingeniería de prompts.

Tarea
Analiza el sílabo que proporcionará el usuario exclusivamente en las secciones:
- Objetivo general
- Objetivos específicos
- Contenidos (incluye actividades, secuencia y carga)
- "Software y recursos educativos utilizados"
- Bibliografía

No analices Metodología ni Evaluación (ignóralas por completo).

🛑 A diferencia de la versión original, no debes re-escribir el sílabo; solo emite observaciones y recomendaciones sobre los aspectos que requieran mejora.

FORMATO DEL INFORME – «Informe de Observaciones»
Entrega las secciones en el orden que sigue.
En cada una:
- Si no hay problemas, escribe (Sin observaciones).
- Si existen problemas, enumera observaciones concisas en viñetas (máx. 3 líneas por viñeta).

Objetivo general
- Conjugación y verbo (infinitivo / 2.ª persona)
- Acción-conocimiento-contexto: precisión y pertinencia
- Verbo adecuado según lista recomendada

Objetivos específicos
- Producto observable / aprendizaje tangible
- Verbos accionables («Aplicar», «Demostrar», etc.)
- Orden lógico de progresión (simple → complejo)

Contenidos
- Correspondencia Objetivos ↔ Contenidos: escribe antes de cualquier tabla uno de los tres veredictos exactamente así: correcta / parcial / incorrecta.
- Si el veredicto es parcial o incorrecta, añade solo las actividades mal vinculadas en la siguiente tabla:
  [Objetivo(s) afectado(s)] | [Problema detectado]
- División en sesiones, subtemas y actividades
- Secuencia temática y carga horaria (densidad)

Software y recursos educativos utilizados
- Presencia y formato de dos columnas
- Cobertura de herramientas críticas y versiones

Bibliografía
- Formato (APA 7)
- Actualización (preferir ediciones ≥ 2023)
- Cobertura temática suficiente

Reglas de estilo
- Sé directo, profesional y específico.
- No incluyas frases elogiosas ni textos superfluos.
- Evita escribir «Está correcto»; si algo no requiere mejora, usa la etiqueta (Sin observaciones).
- Mantén viñetas claras y tablas donde se indiquen.
- Usa fechas absolutas ("26 de mayo de 2025") para evitar ambigüedad.
- Todas las sugerencias deben ser concretas y accionables.

Aquí está el sílabo a analizar:
${documentoTexto}`;

      // Segundo análisis: Extracción de temas por sesión
      const promptSesiones = `Analiza el siguiente sílabo y extrae los temas específicos de cada sesión. 
      
Para cada sesión que encuentres, devuelve la información en este formato JSON:
{
  "sesiones": [
    {
      "sesion": "Sesión 1",
      "temas": ["tema1", "tema2", "tema3"]
    },
    {
      "sesion": "Sesión 2", 
      "temas": ["tema1", "tema2"]
    }
  ]
}

Sílabo:
${documentoTexto}`;

      // Hacer las llamadas a DeepSeek API
      const [analisisGeneral, analisisSesiones] = await Promise.all([
        realizarAnalisis(promptRevision),
        realizarAnalisis(promptSesiones)
      ]);

      // Procesar respuesta de sesiones
      let sesionesData: SesionTema[] = [];
      try {
        const sesionesJson = JSON.parse(analisisSesiones);
        sesionesData = sesionesJson.sesiones || [];
      } catch (error) {
        console.error('Error parsing sesiones:', error);
        toast.error('Error al procesar los temas por sesión');
      }

      // Dividir el análisis general en secciones
      const secciones = analisisGeneral.split('\n\n');
      const resultadoFinal: AnalisisResultado = {
        objetivoGeneral: extraerSeccion(secciones, 'Objetivo general') || '(Sin observaciones)',
        objetivosEspecificos: extraerSeccion(secciones, 'Objetivos específicos') || '(Sin observaciones)',
        contenidos: extraerSeccion(secciones, 'Contenidos') || '(Sin observaciones)',
        softwareRecursos: extraerSeccion(secciones, 'Software y recursos educativos utilizados') || '(Sin observaciones)',
        bibliografia: extraerSeccion(secciones, 'Bibliografía') || '(Sin observaciones)',
        sesiones: sesionesData
      };

      setResultado(resultadoFinal);
      toast.success('Análisis completado exitosamente');

    } catch (error) {
      console.error('Error en análisis:', error);
      toast.error('Error al analizar el sílabo. Verifica la configuración de la API.');
    } finally {
      setAnalizando(false);
    }
  };

  const realizarAnalisis = async (prompt: string): Promise<string> => {
    const response = await fetch('/api/deepseek-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Error en la API de DeepSeek');
    }

    const data = await response.json();
    return data.result;
  };

  const extraerSeccion = (secciones: string[], nombreSeccion: string): string => {
    const seccion = secciones.find(s => s.toLowerCase().includes(nombreSeccion.toLowerCase()));
    return seccion || '';
  };

  const procesarDecision = async (aprobado: boolean) => {
    if (!cursoSeleccionado || !resultado) {
      toast.error('No hay análisis para procesar');
      return;
    }

    setProcesandoDecision(true);

    try {
      // Crear el informe completo
      const informeCompleto = `
# Informe de Revisión de Sílabo

**Curso:** ${cursoSeleccionado.nombre_curso}
**Código:** ${cursoSeleccionado.codigo}
**Fecha de Revisión:** ${new Date().toLocaleDateString('es-ES')}
**Estado:** ${aprobado ? 'APROBADO' : 'DESAPROBADO'}

## Objetivo General
${resultado.objetivoGeneral}

## Objetivos Específicos
${resultado.objetivosEspecificos}

## Contenidos
${resultado.contenidos}

## Software y Recursos Educativos
${resultado.softwareRecursos}

## Bibliografía
${resultado.bibliografia}

${resultado.sesiones.length > 0 ? `
## Temas por Sesión
${resultado.sesiones.map(sesion => `
**${sesion.sesion}:**
${sesion.temas.map(tema => `- ${tema}`).join('\n')}
`).join('\n')}
` : ''}
      `.trim();

      // Guardar en la base de datos
      const { error } = await supabase
        .from('revision_silabus')
        .upsert({
          curso_id: cursoSeleccionado.id?.toString(),
          estado: aprobado ? 'aprobado' : 'desaprobado',
          informe_revision: informeCompleto,
          revisor: 'Sistema IA', // Puedes cambiar esto por el usuario actual
          observaciones: aprobado ? 'Sílabo aprobado automáticamente' : 'Sílabo requiere mejoras'
        });

      if (error) {
        console.error('Error guardando revisión:', error);
        toast.error('Error al guardar la decisión');
        return;
      }

      toast.success(`Sílabo ${aprobado ? 'aprobado' : 'desaprobado'} exitosamente`);
      
      // Recargar datos y limpiar estado
      await cargarCursosConRevision();
      setCursoSeleccionado(null);
      setResultado(null);

    } catch (error) {
      console.error('Error procesando decisión:', error);
      toast.error('Error al procesar la decisión');
    } finally {
      setProcesandoDecision(false);
    }
  };

  const getEstadoBadge = (revision?: RevisionSilabo) => {
    if (!revision) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Sin revisar</span>;
    }
    
    if (revision.estado === 'aprobado') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprobado</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Desaprobado</span>;
    }
  };

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Revisión de Sílabos con IA</h2>
      
      {/* Lista de documentos para revisión */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Disponibles para Revisión</h3>
        <div className="space-y-4">
          {cursosConRevision.map((curso) => (
            <div 
              key={curso.id} 
              className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-gray-900">{curso.nombre_curso}</h4>
                  {getEstadoBadge(curso.revision)}
                </div>
                <p className="text-sm text-gray-600">{curso.archivo_nombre}</p>
                <p className="text-sm text-gray-500">Código: {curso.codigo}</p>
                {curso.revision && (
                  <p className="text-xs text-gray-400 mt-1">
                    Revisado el: {new Date(curso.revision.fecha_revision).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {curso.revision && (
                  <button
                    onClick={() => {
                      setCursoSeleccionado(curso);
                      // Mostrar informe existente
                      setResultado({
                        objetivoGeneral: 'Informe guardado',
                        objetivosEspecificos: 'Informe guardado',
                        contenidos: 'Informe guardado',
                        softwareRecursos: 'Informe guardado',
                        bibliografia: 'Informe guardado',
                        sesiones: []
                      });
                    }}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Ver Informe
                  </button>
                )}
                <button
                  onClick={() => analizarSilabo(curso)}
                  disabled={analizando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {analizando && cursoSeleccionado?.id === curso.id ? 'Analizando...' : 'Revisar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resultados del análisis */}
      {resultado && cursoSeleccionado && (
        <div className="space-y-6">
          {/* Mostrar informe existente o nuevo análisis */}
          {cursoSeleccionado.revision ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Informe de Revisión Guardado</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <MarkdownRenderer content={cursoSeleccionado.revision.informe_revision} />
              </div>
            </div>
          ) : (
            <>
              {/* Informe de Observaciones */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Informe de Observaciones</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Objetivo General</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MarkdownRenderer content={resultado.objetivoGeneral} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Objetivos Específicos</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MarkdownRenderer content={resultado.objetivosEspecificos} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Contenidos</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MarkdownRenderer content={resultado.contenidos} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Software y Recursos Educativos</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MarkdownRenderer content={resultado.softwareRecursos} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Bibliografía</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MarkdownRenderer content={resultado.bibliografia} />
                    </div>
                  </div>
                </div>

                {/* Botones de decisión */}
                <div className="flex gap-4 mt-8 pt-6 border-t">
                  <button
                    onClick={() => procesarDecision(true)}
                    disabled={procesandoDecision}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {procesandoDecision ? 'Procesando...' : '✅ Aprobar Sílabo'}
                  </button>
                  <button
                    onClick={() => procesarDecision(false)}
                    disabled={procesandoDecision}
                    className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {procesandoDecision ? 'Procesando...' : '❌ Desaprobar Sílabo'}
                  </button>
                </div>
              </div>

              {/* Temas por sesión */}
              {resultado.sesiones.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">📚 Temas por Sesión</h3>
                  <div className="grid gap-4">
                    {resultado.sesiones.map((sesion, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-semibold text-gray-800 mb-2">{sesion.sesion}</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {sesion.temas.map((tema, temaIndex) => (
                            <li key={temaIndex} className="text-gray-600 text-sm">{tema}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 