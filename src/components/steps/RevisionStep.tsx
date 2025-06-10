'use client';

import { useState, useEffect } from 'react';
import { CursoConRevision, RevisionSilabo, AnalisisResultado, SesionTema } from '@/types';

interface SesionJSON {
  numero_sesion: number;
  tema_principal: string;
  subtemas?: string[];
  actividad?: string;
  recursos?: string[];
  evaluacion?: string;
  duracion_horas?: string;
}
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';
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
  const [informeMostrado, setInformeMostrado] = useState<string | null>(null);
  const [jsonMostrado, setJsonMostrado] = useState<Record<string, unknown> | null>(null);
  const [tipoContenidoMostrado, setTipoContenidoMostrado] = useState<'informe' | 'json' | null>(null);

  useEffect(() => {
    cargarCursosConRevision();
  }, [cursos]);

  const cargarCursosConRevision = async () => {
    try {
      // Obtener todas las revisiones existentes
      const { data: revisiones, error } = await supabase
        .from('revision_silabus')
        .select('*');

      console.log('🔍 Revisiones cargadas:', revisiones);

      if (error) {
        console.error('Error cargando revisiones:', error);
        toast.error('Error al cargar el estado de revisiones');
        return;
      }

      // Combinar cursos con sus revisiones
      const cursosConEstado = cursos.map(curso => {
        const revision = revisiones?.find(r => r.curso_id === curso.id);
        console.log(`🔍 Curso ${curso.nombre_curso} - Revisión:`, revision);
        return {
          ...curso,
          revision: revision || undefined
        };
      });

      console.log('🔍 Cursos con estado final:', cursosConEstado);
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

      // Primer análisis: Informe completo del contenido del sílabo
      const promptInforme = `Analiza el sílabo y genera un informe estructurado con:

# INFORME DE ANÁLISIS DE SÍLABO

## INFORMACIÓN GENERAL
Extrae: nombre del curso, código, créditos, modalidad

## OBJETIVOS
Evalúa objetivo general y específicos: formulación, alineación, medibilidad

## CONTENIDOS
Analiza: número de sesiones, secuencia lógica, cobertura de objetivos

## RECURSOS Y METODOLOGÍA
Lista: herramientas, recursos didácticos, pertinencia

## BIBLIOGRAFÍA
Evalúa: cantidad, actualización, relevancia

## EVALUACIÓN GENERAL
- Fortalezas principales
- Áreas de mejora críticas  
- 3 recomendaciones prioritarias
- Conclusión final

---
DOCUMENTO:
${documentoTexto}`;

      // Segundo análisis: Extracción de JSON estructurado de sesiones
      const promptJSON = `Extrae las sesiones del sílabo en formato JSON:

{
  "metadatos": {
    "total_sesiones": [número],
    "fecha_extraccion": "${new Date().toISOString()}",
    "curso": "[nombre del curso]"
  },
  "sesiones": [
    {
      "numero_sesion": 1,
      "tema_principal": "[tema]",
      "subtemas": ["[subtema1]", "[subtema2]"],
      "actividad": "[actividad completa tal como aparece]",
      "recursos": ["[recurso1]"],
      "evaluacion": "[evaluación]",
      "duracion_horas": "[horas]"
    }
  ]
}

Reglas:
- Incluye actividad COMPLETA (foros, productos, etc.)
- Campos vacíos: "" o []
- JSON válido únicamente

DOCUMENTO:
${documentoTexto}`;

      // Hacer las llamadas a DeepSeek API
      console.log('🔄 Iniciando análisis con DeepSeek API...');
      
      const [informeCompleto, sesionesJSON] = await Promise.all([
        realizarAnalisis(promptInforme),
        realizarAnalisis(promptJSON)
      ]);

      console.log('✅ Análisis completados exitosamente');

      // Procesar respuesta de sesiones JSON
      let sesionesData: SesionTema[] = [];
      let jsonEstructurado = null;
      
      try {
        // Intentar parsear como JSON
        const jsonLimpio = sesionesJSON.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        jsonEstructurado = JSON.parse(jsonLimpio);
        
        // Convertir a formato interno si es necesario
        if (jsonEstructurado.sesiones && Array.isArray(jsonEstructurado.sesiones)) {
          sesionesData = jsonEstructurado.sesiones.map((sesion: SesionJSON) => ({
            sesion: `Sesión ${sesion.numero_sesion}`,
            temas: [
              sesion.tema_principal,
              ...(sesion.subtemas || []),
              ...(sesion.actividad ? [sesion.actividad] : []),
              ...(sesion.evaluacion ? [sesion.evaluacion] : [])
            ].filter(Boolean)
          }));
        }
        
        console.log('📚 JSON procesado correctamente:', jsonEstructurado);
      } catch (error) {
        console.error('❌ Error procesando JSON:', error);
        console.log('📄 Respuesta JSON original:', sesionesJSON);
        // Si hay error, mantener un array vacío
        sesionesData = [];
        jsonEstructurado = { error: "Error al procesar JSON", raw: sesionesJSON };
      }

      // El resultado ahora incluye tanto el informe como el JSON
      const resultadoFinal: AnalisisResultado = {
        // Para mantener compatibilidad, dividimos el informe
        objetivoGeneral: informeCompleto.substring(0, informeCompleto.length / 5),
        objetivosEspecificos: informeCompleto.substring(informeCompleto.length / 5, informeCompleto.length * 2 / 5),
        contenidos: informeCompleto.substring(informeCompleto.length * 2 / 5, informeCompleto.length * 3 / 5),  
        softwareRecursos: informeCompleto.substring(informeCompleto.length * 3 / 5, informeCompleto.length * 4 / 5),
        bibliografia: informeCompleto.substring(informeCompleto.length * 4 / 5),
        sesiones: sesionesData,
        // Nuevos campos para los productos solicitados
        informeCompleto: informeCompleto,
        jsonSesiones: jsonEstructurado
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

    try {
      const response = await fetch('/api/deepseek-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ Error en API response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });

        // Manejo específico de errores comunes
        if (response.status === 504) {
          throw new Error('El análisis está tardando mucho. Por favor intenta con un sílabo más corto o vuelve a intentar.');
        }
        
        if (response.status === 401) {
          throw new Error('Error de autenticación con la API de IA. Contacta al administrador.');
        }
        
        if (response.status === 429) {
          throw new Error('Límite de peticiones excedido. Espera unos minutos antes de intentar nuevamente.');
        }

        throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      const apiError = error as { name?: string; message?: string };
      if (apiError.name === 'AbortError') {
        throw new Error('El análisis se canceló por timeout. Por favor intenta con un documento más corto.');
      }
      
      throw error;
    }
  };



  // Función para descargar el informe como archivo de texto
  const descargarInforme = () => {
    if (!resultado || !cursoSeleccionado) {
      toast.error('No hay informe para descargar');
      return;
    }

    const informeTexto = resultado.informeCompleto || `
# Informe de Revisión de Sílabo

**Curso:** ${cursoSeleccionado.nombre_curso}
**Código:** ${cursoSeleccionado.codigo}
**Fecha de Revisión:** ${new Date().toLocaleDateString('es-ES')}

${resultado.objetivoGeneral}

${resultado.objetivosEspecificos}

${resultado.contenidos}

${resultado.softwareRecursos}

${resultado.bibliografia}
    `.trim();

    const blob = new Blob([informeTexto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_silabo_${cursoSeleccionado.codigo}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('📄 Informe descargado exitosamente');
  };

  // Función para descargar el JSON de sesiones
  const descargarJSON = () => {
    if (!resultado || !cursoSeleccionado) {
      toast.error('No hay datos JSON para descargar');
      return;
    }

    const jsonData = resultado.jsonSesiones || {
      metadatos: {
        total_sesiones: resultado.sesiones.length,
        fecha_extraccion: new Date().toISOString(),
        curso: cursoSeleccionado.nombre_curso,
        codigo: cursoSeleccionado.codigo
      },
      sesiones: resultado.sesiones.map((sesion, index) => ({
        numero_sesion: index + 1,
        tema_principal: sesion.temas[0] || '',
        subtemas: sesion.temas.slice(1),
        actividades_aprendizaje: [],
        actividades_evaluacion: [],
        recursos: []
      }))
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sesiones_${cursoSeleccionado.codigo}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('📁 JSON descargado exitosamente');
  };

  // Función para mostrar informe guardado desde base de datos
  const mostrarInformeGuardado = async (curso: CursoConRevision) => {
    if (!curso.revision) {
      toast.error('No hay informe guardado para este curso');
      return;
    }

    try {
      // Obtener datos completos de la revisión
      const { data: revision, error } = await supabase
        .from('revision_silabus')
        .select('*')
        .eq('id', curso.revision.id)
        .single();

      if (error) {
        console.error('Error obteniendo revisión:', error);
        toast.error('Error al obtener el informe guardado');
        return;
      }

      // Usar el informe completo si está disponible, sino usar el informe_revision
      const contenidoInforme = revision.informe_completo || revision.informe_revision;
      
      // Mostrar el informe en la página
      setInformeMostrado(contenidoInforme);
      setTipoContenidoMostrado('informe');
      setCursoSeleccionado(curso);
      
      toast.success('📄 Informe mostrado exitosamente');
    } catch (error) {
      console.error('Error obteniendo informe:', error);
      toast.error('Error al obtener el informe');
    }
  };

  // Función para mostrar JSON guardado desde base de datos
  const mostrarJSONGuardado = async (curso: CursoConRevision) => {
    if (!curso.revision) {
      toast.error('No hay datos JSON guardados para este curso');
      return;
    }

    try {
      // Obtener datos completos de la revisión
      const { data: revision, error } = await supabase
        .from('revision_silabus')
        .select('*')
        .eq('id', curso.revision.id)
        .single();

      if (error) {
        console.error('Error obteniendo revisión:', error);
        toast.error('Error al obtener los datos JSON guardados');
        return;
      }

      if (!revision.json_sesiones) {
        toast.error('No hay datos JSON disponibles para este curso');
        return;
      }

      // Mostrar el JSON en la página
      setJsonMostrado(revision.json_sesiones);
      setTipoContenidoMostrado('json');
      setCursoSeleccionado(curso);
      
      toast.success('📁 JSON mostrado exitosamente');
    } catch (error) {
      console.error('Error obteniendo JSON:', error);
      toast.error('Error al obtener el JSON');
    }
  };

  const procesarDecision = async (aprobado: boolean) => {
    if (!cursoSeleccionado || !resultado) {
      toast.error('No hay análisis para procesar');
      return;
    }

    setProcesandoDecision(true);

    try {
      // Usar el informe completo si está disponible, sino crear uno
      const informeCompleto = resultado.informeCompleto || `
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

      // Preparar datos JSON para guardar
      const jsonSesiones = resultado.jsonSesiones || {
        metadatos: {
          total_sesiones: resultado.sesiones.length,
          fecha_extraccion: new Date().toISOString(),
          curso: cursoSeleccionado.nombre_curso,
          codigo: cursoSeleccionado.codigo
        },
        sesiones: resultado.sesiones.map((sesion, index) => ({
          numero_sesion: index + 1,
          tema_principal: sesion.temas[0] || '',
          subtemas: sesion.temas.slice(1),
          actividad: sesion.temas.find(t => t.toLowerCase().includes('actividad')) || '',
          recursos: [],
          evaluacion: sesion.temas.find(t => t.toLowerCase().includes('evaluacion')) || '',
          duracion_horas: ''
        }))
      };

      // Guardar en la base de datos con los nuevos campos
      const { error } = await supabase
        .from('revision_silabus')
        .insert({
          curso_id: cursoSeleccionado.id,
          estado: aprobado ? 'aprobado' : 'desaprobado',
          informe_revision: informeCompleto,
          informe_completo: resultado.informeCompleto || informeCompleto, // Nuevo campo
          json_sesiones: jsonSesiones, // Nuevo campo
          revisor: 'Sistema IA', // Puedes cambiar esto por el usuario actual
          observaciones: aprobado ? 'Sílabo aprobado automáticamente' : 'Sílabo requiere mejoras'
        });

      if (error) {
        console.error('Error guardando revisión:', error);
        toast.error('Error al guardar la decisión');
        return;
      }

      toast.success(`Sílabo ${aprobado ? 'aprobado' : 'desaprobado'} exitosamente`);
      
      // Recargar datos pero mantener el curso seleccionado para seguir viendo el resultado
      await cargarCursosConRevision();

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
                  <>
                    <button
                      onClick={() => mostrarInformeGuardado(curso)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      title="Ver informe guardado"
                    >
                      📄 Informe
                    </button>
                    <button
                      onClick={() => mostrarJSONGuardado(curso)}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                      title="Ver JSON guardado"
                    >
                      📁 JSON
                    </button>
                  </>
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

      {/* Mostrar contenido guardado cuando se hace clic en los botones */}
      {tipoContenidoMostrado && cursoSeleccionado && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {tipoContenidoMostrado === 'informe' ? '📋 Informe Guardado' : '📁 JSON Guardado'}
            </h3>
            <button
              onClick={() => {
                setTipoContenidoMostrado(null);
                setInformeMostrado(null);
                setJsonMostrado(null);
                setCursoSeleccionado(null);
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              ✕ Cerrar
            </button>
          </div>
          
          {tipoContenidoMostrado === 'informe' && informeMostrado && (
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <MarkdownRenderer content={informeMostrado} />
            </div>
          )}
          
          {tipoContenidoMostrado === 'json' && jsonMostrado && (
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(jsonMostrado, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Resultados del análisis */}
      {resultado && cursoSeleccionado && !tipoContenidoMostrado && (
        <div className="space-y-6">
          {/* Mostrar informe existente o nuevo análisis */}
          {cursoSeleccionado.revision && resultado.objetivoGeneral === 'Informe guardado' ? (
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
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">📋 Informe de Observaciones</h3>
                  
                  {/* Botones de descarga */}
                  <div className="flex gap-2">
                    <button
                      onClick={descargarInforme}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      📄 Descargar Informe
                    </button>
                    <button
                      onClick={descargarJSON}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      📁 Descargar JSON
                    </button>
                  </div>
                </div>
                
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

              {/* JSON Estructurado */}
              {resultado.jsonSesiones && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">🔧 JSON Estructurado de Sesiones</h3>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-gray-700">
                      {typeof resultado.jsonSesiones === 'object' 
                        ? JSON.stringify(resultado.jsonSesiones, null, 2)
                        : resultado.jsonSesiones
                      }
                    </pre>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Este JSON contiene la estructura detallada de todas las sesiones con sus temas, actividades y recursos.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 