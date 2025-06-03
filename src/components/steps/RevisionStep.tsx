'use client';

import { useState, useEffect } from 'react';
import { CursoConRevision, RevisionSilabo, AnalisisResultado, SesionTema } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';
// @ts-ignore
import mammoth from 'mammoth';

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
        const revision = revisiones?.find(r => r.curso_id === curso.id);
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
      // Obtener el contenido del documento desde Supabase Storage
      console.log('🔄 Obteniendo archivo desde Supabase Storage...');
      console.log('📁 Path del archivo:', curso.archivo_url);

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('archivos')
        .download(curso.archivo_url);

      if (downloadError) {
        console.error('❌ Error al descargar archivo:', downloadError);
        throw new Error(`Error al obtener el documento: ${downloadError.message}`);
      }

      if (!fileData) {
        throw new Error('No se pudo obtener el contenido del archivo');
      }

      let documentoTexto = '';

      // Detectar el tipo de archivo y procesarlo apropiadamente
      const fileName = curso.archivo_nombre.toLowerCase();
      
      if (fileName.endsWith('.docx')) {
        console.log('📄 Procesando archivo .docx con mammoth...');
        
        // Convertir el blob a ArrayBuffer para mammoth
        const arrayBuffer = await fileData.arrayBuffer();
        
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          documentoTexto = result.value;
          
          if (result.messages && result.messages.length > 0) {
            console.log('⚠️ Mensajes de mammoth:', result.messages);
          }
        } catch (mammothError) {
          console.error('❌ Error con mammoth:', mammothError);
          throw new Error('Error al procesar el archivo .docx');
        }
      } else {
        // Para archivos de texto plano (.txt, .md, etc.)
        console.log('📄 Procesando archivo de texto plano...');
        documentoTexto = await fileData.text();
      }

      console.log('✅ Archivo procesado exitosamente');
      console.log('📄 Contenido del documento (primeros 500 caracteres):', documentoTexto.substring(0, 500));
      console.log('📏 Longitud total del documento:', documentoTexto.length);
      
      if (!documentoTexto || documentoTexto.trim().length === 0) {
        throw new Error('El documento está vacío o no se pudo leer');
      }

      // Verificar si el documento parece ser un sílabo válido
      const palabrasClave = ['objetivo', 'contenido', 'tema', 'sesion', 'competencia', 'curso', 'bibliografia'];
      const tieneContenidoRelevante = palabrasClave.some(palabra => 
        documentoTexto.toLowerCase().includes(palabra)
      );

      if (!tieneContenidoRelevante) {
        console.warn('El documento no parece contener información típica de un sílabo');
      }

      // Primer análisis: Revisión general del sílabo (prompt optimizado del usuario)
      const promptRevision = `Rol
Actúa como un experto en diseño curricular con amplia experiencia en la elaboración y evaluación de programas de nivel superior, especializado en la metodología «Aprende Haciendo» y en la ingeniería de prompts.

Tarea
Analiza el sílabo que proporcionará el usuario exclusivamente en las secciones:
Objetivo general
Objetivos específicos
Contenidos (incluye temas, actividades/evaluación, secuencia y carga)
"Software y recursos educativos utilizados" (si existe en el sílabo)
Bibliografía
No analices Metodología ni Evaluación (ignóralas por completo).

🛑 No debes re-escribir el sílabo; solo emite observaciones y recomendaciones sobre los aspectos que requieran mejora.

FORMATO DEL INFORME – «Informe de Observaciones»
Entrega las secciones en el orden que sigue.
En cada una:

Si no hay problemas, escribe (Sin observaciones).

Si existen problemas, enumera observaciones concisas en viñetas (máx. 3 líneas por viñeta).

Objetivo general
Conjugación y verbo (infinitivo / 2.ª persona).
Acción-conocimiento-contexto: precisión y pertinencia.
Verbo adecuado según taxonomías reconocidas (ej. Bloom, Marzano).

Objetivos específicos
Producto observable / aprendizaje tangible.
Verbos accionables («Aplicar», «Demostrar», «Evaluar», «Crear», etc.).
Orden lógico de progresión (simple → complejo).
Alineación directa con el Objetivo General.

Contenidos
Extracción de Temas y Actividades por Sesión:
Antes de cualquier análisis de la sección "Contenidos", primero extrae y presenta la siguiente información para CADA sesión encontrada en la tabla 'CONTENIDOS' del sílabo, utilizando el siguiente formato exacto para cada una:

**SESIÓN [Número de Sesión]**
**TEMA:**
[Contenido completo de la columna 'TEMA' para esta sesión, incluyendo subpuntos numerados si los hay]
**ACTIVIDAD/EVALUACIÓN:**
[Contenido completo de la columna 'ACTIVIDAD/EVALUACIÓN' para esta sesión, incluyendo 'Producto buscado' si lo hay]
---
(Repetir este bloque para cada sesión)

Análisis de Contenidos:
Correspondencia Objetivos Específicos ↔ Contenidos (Temas y Actividades/Evaluación extraídos): escribe antes de cualquier tabla uno de los tres veredictos exactamente así: correcta / parcial / incorrecta.
Si el veredicto es parcial o incorrecta, añade solo las actividades/temas mal vinculados o ausentes, o los objetivos no cubiertos, en la siguiente tabla:
[Objetivo(s) Específico(s) afectado(s)] | [Problema detectado en Tema o Actividad/Evaluación (o ausencia de cobertura)]
Adecuación de la división en sesiones y la distribución de subtemas para cubrir los objetivos.
Secuencia temática y carga horaria (densidad aparente de contenidos por sesión en relación con las horas cronológicas del curso).
Pertinencia y claridad de las "Actividades/Evaluación" y "Productos buscados" para cada sesión, y su contribución al logro de los objetivos específicos.

Software y recursos educativos utilizados
Presencia y formato (si la sección existe en el sílabo; si no, indicar "Sección no encontrada en el sílabo").
Cobertura de herramientas críticas para los contenidos y actividades, y si se especifican versiones o alternativas.

Bibliografía
Formato (verificar si se aproxima a APA 7 u otro estándar consistente).
Actualización (presencia de fuentes recientes, idealmente de los últimos 5-7 años, aunque se valora la relevancia de clásicos si aplica).
Cobertura temática suficiente y pertinente en relación con los contenidos del curso.

Reglas de estilo
Sé directo, profesional y específico.
No incluyas frases elogiosas ni textos superfluos.
Evita escribir «Está correcto»; si algo no requiere mejora, usa la etiqueta (Sin observaciones).
Mantén viñetas claras y tablas donde se indiquen.
Usa fechas absolutas (ej. "26 de mayo de 2025") solo si es estrictamente necesario para la claridad de una recomendación.
Todas las sugerencias deben ser concretas y accionables.

DOCUMENTO A ANALIZAR:
${documentoTexto}`;

      // Segundo análisis: Extracción simple de sesiones (sin JSON para evitar errores)
      const promptSesiones = `Extrae únicamente los temas/contenidos principales del siguiente documento de sílabo.

Lista cada sesión que encuentres con el formato:
SESIÓN 1: [tema principal]
SESIÓN 2: [tema principal]
etc.

Si no encuentras sesiones numeradas, lista los temas principales que identifiques.

DOCUMENTO:
${documentoTexto}`;

      // Hacer las llamadas a DeepSeek API
      console.log('🔄 Iniciando análisis con DeepSeek API...');
      
      const [analisisGeneral, analisisSesiones] = await Promise.all([
        realizarAnalisis(promptRevision),
        realizarAnalisis(promptSesiones)
      ]);

      console.log('✅ Análisis completados exitosamente');

      // Procesar respuesta de sesiones
      let sesionesData: SesionTema[] = [];
      try {
        // Intentar procesar como texto simple (formato: SESIÓN X: tema)
        const lineasSesiones = analisisSesiones.split('\n').filter(linea => linea.trim());
        
        lineasSesiones.forEach((linea, index) => {
          const match = linea.match(/SESIÓN\s*(\d+):\s*(.+)/i);
          if (match) {
            sesionesData.push({
              sesion: `Sesión ${match[1]}`,
              temas: [match[2].trim()]
            });
          } else if (linea.trim() && !linea.includes(':')) {
            // Si es solo un tema sin formato de sesión
            sesionesData.push({
              sesion: `Tema ${index + 1}`,
              temas: [linea.trim()]
            });
          }
        });
        
        console.log('📚 Sesiones procesadas:', sesionesData.length);
      } catch (error) {
        console.error('❌ Error procesando sesiones:', error);
        console.log('📄 Respuesta de sesiones original:', analisisSesiones);
        // Si hay error, mantener un array vacío
        sesionesData = [];
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
      
      // Verificar si es un error de API Key
      if (error instanceof Error && error.message.includes('500')) {
        toast.error('❌ API Key de DeepSeek no configurada.\n\n1. Crea un archivo .env.local\n2. Agrega: DEEPSEEK_API_KEY=tu_api_key\n3. Reinicia el servidor\n\nRevisa CONFIGURACION.md para más detalles');
      } else if (error instanceof Error && error.message.includes('401')) {
        toast.error('❌ API Key de DeepSeek inválida.\nVerifica tu clave en https://platform.deepseek.com/api_keys');
      } else {
        toast.error(`Error al analizar el sílabo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
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
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Error en API response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
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
          curso_id: cursoSeleccionado.id,
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