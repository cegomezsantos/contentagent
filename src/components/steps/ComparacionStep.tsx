'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import MarkdownRenderer from '../MarkdownRenderer';
import { CursoConRevision, InvestigacionSesion, ComparacionSesion } from '../../types';

interface ComparacionStepProps {
  cursos: CursoConRevision[];
  onRefresh?: () => Promise<void>;
}

interface SesionConComparacion {
  numero_sesion: number;
  tema_principal: string;
  investigacion?: InvestigacionSesion;
  comparacion?: ComparacionSesion;
}

export default function ComparacionStep({ cursos, onRefresh }: ComparacionStepProps) {
  const [sesionesData, setSesionesData] = useState<{ [cursoId: string]: SesionConComparacion[] }>({});
  const [cursoExpandido, setCursoExpandido] = useState<string | null>(null);
  const [comparando, setComparando] = useState<string | null>(null);
  const [comparacionMostrada, setComparacionMostrada] = useState<string | null>(null);
  const [documentosSubiendo, setDocumentosSubiendo] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    cargarSesionesConComparaciones();
  }, [cursos]);

  const cargarSesionesConComparaciones = async () => {
    try {
      console.log('📊 Cargando sesiones con comparaciones:', cursos);

      // Obtener todas las investigaciones e comparaciones existentes
      const [investigacionesResult, comparacionesResult] = await Promise.all([
        supabase.from('investigaciones_sesiones').select('*'),
        supabase.from('comparaciones_sesiones').select('*')
      ]);

      if (investigacionesResult.error || comparacionesResult.error) {
        console.error('Error cargando datos:', { investigacionesResult, comparacionesResult });
        return;
      }

      const investigaciones = investigacionesResult.data || [];
      const comparaciones = comparacionesResult.data || [];
      const sesionesMap: { [cursoId: string]: SesionConComparacion[] } = {};

      for (const curso of cursos) {
        // Solo mostrar cursos que tienen revisión aprobada
        if (curso.revision?.estado === 'aprobado') {
          try {
            // Obtener investigaciones de este curso
            const investigacionesCurso = investigaciones.filter(inv => inv.curso_id === curso.id);
            
            if (investigacionesCurso.length > 0) {
              const sesiones: SesionConComparacion[] = investigacionesCurso.map((investigacion) => {
                const comparacion = comparaciones.find(
                  comp => comp.curso_id === curso.id && comp.numero_sesion === investigacion.numero_sesion
                );
                
                return {
                  numero_sesion: investigacion.numero_sesion,
                  tema_principal: investigacion.tema_sesion,
                  investigacion,
                  comparacion
                };
              });

              sesionesMap[curso.id!] = sesiones.sort((a, b) => a.numero_sesion - b.numero_sesion);
            }
          } catch (error) {
            console.error(`Error procesando curso ${curso.nombre_curso}:`, error);
          }
        }
      }

      setSesionesData(sesionesMap);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las comparaciones');
    }
  };

  const toggleCurso = (cursoId: string) => {
    setCursoExpandido(cursoExpandido === cursoId ? null : cursoId);
  };

  const subirDocumento = async (file: File, cursoId: string, numeroSesion: number, tipoDoc: 'doc1' | 'doc2') => {
    const uploadKey = `${cursoId}-${numeroSesion}-${tipoDoc}`;
    setDocumentosSubiendo(prev => ({ ...prev, [uploadKey]: true }));

    try {
      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `comparaciones/${cursoId}/${numeroSesion}/${tipoDoc}_${timestamp}_${file.name}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Error subiendo archivo: ${error.message}`);
      }

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      const documentoUrl = urlData.publicUrl;

      // Verificar si ya existe una comparación para esta sesión
      const { data: comparacionExistente } = await supabase
        .from('comparaciones_sesiones')
        .select('*')
        .eq('curso_id', cursoId)
        .eq('numero_sesion', numeroSesion)
        .single();

      // Preparar datos para actualizar
      const datosComparacion = {
        curso_id: cursoId,
        numero_sesion: numeroSesion,
        investigacion_id: sesionesData[cursoId]?.find(s => s.numero_sesion === numeroSesion)?.investigacion?.id,
        [tipoDoc === 'doc1' ? 'documento1_url' : 'documento2_url']: documentoUrl,
        [tipoDoc === 'doc1' ? 'documento1_nombre' : 'documento2_nombre']: file.name,
        estado: 'pendiente'
      };

      if (comparacionExistente) {
        // Actualizar registro existente
        const { error: updateError } = await supabase
          .from('comparaciones_sesiones')
          .update(datosComparacion)
          .eq('id', comparacionExistente.id);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo registro
        const { error: insertError } = await supabase
          .from('comparaciones_sesiones')
          .insert(datosComparacion);

        if (insertError) throw insertError;
      }

      toast.success(`📄 Documento ${tipoDoc === 'doc1' ? '1' : '2'} subido exitosamente`);
      
      // Recargar datos
      await cargarSesionesConComparaciones();

    } catch (error) {
      console.error('Error subiendo documento:', error);
      toast.error(`Error al subir documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDocumentosSubiendo(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const realizarComparacion = async (curso: CursoConRevision, sesion: SesionConComparacion) => {
    if (!sesion.investigacion || !sesion.comparacion) {
      toast.error('Se requiere investigación y documentos para realizar la comparación');
      return;
    }

    if (!sesion.comparacion.documento1_url || !sesion.comparacion.documento2_url) {
      toast.error('Se requieren ambos documentos para realizar la comparación');
      return;
    }

    const comparacionKey = `${curso.id}-${sesion.numero_sesion}`;
    setComparando(comparacionKey);

    try {
      // Actualizar estado a procesando
      await supabase
        .from('comparaciones_sesiones')
        .update({ estado: 'procesando' })
        .eq('id', sesion.comparacion.id);

      const prompt = `Eres un experto analista académico especializado en comparación de contenidos. Tu tarea es realizar una comparación exhaustiva entre una investigación académica y documentos externos para validar la coherencia y calidad del contenido.

**INFORMACIÓN A COMPARAR:**

**1. INVESTIGACIÓN REALIZADA:**
${sesion.investigacion.contenido_investigacion}

**2. CONTEXTO:**
- Curso: ${curso.nombre_curso}
- Código: ${curso.codigo}
- Sesión: ${sesion.numero_sesion}
- Tema: ${sesion.tema_principal}

**3. DOCUMENTOS COMPARATIVOS:**
- Documento 1: ${sesion.comparacion.documento1_nombre}
- Documento 2: ${sesion.comparacion.documento2_nombre}

**INSTRUCCIONES PARA EL ANÁLISIS COMPARATIVO:**

Realiza un análisis detallado comparando la investigación con los documentos proporcionados, evaluando:

1. **COHERENCIA CONCEPTUAL:** ¿Los conceptos y definiciones coinciden?
2. **ACTUALIZACIÓN:** ¿La información está actualizada según los documentos?
3. **PROFUNDIDAD:** ¿El nivel de detalle es apropiado?
4. **PRECISIÓN:** ¿Los datos y estadísticas son consistentes?
5. **APLICABILIDAD:** ¿Las aplicaciones prácticas son válidas?

**ESTRUCTURA OBLIGATORIA DEL INFORME:**

# ANÁLISIS COMPARATIVO: ${sesion.tema_principal}

## 1. RESUMEN EJECUTIVO
- Nivel de concordancia general (%)
- Principales puntos de coincidencia
- Discrepancias identificadas

## 2. ANÁLISIS DETALLADO

### 2.1 Concordancias Encontradas
- Conceptos que coinciden
- Datos validados
- Enfoques similares

### 2.2 Discrepancias Identificadas
- Diferencias conceptuales
- Datos contradictorios
- Enfoques divergentes

### 2.3 Información Complementaria
- Aspectos adicionales en documentos externos
- Información no cubierta en la investigación

## 3. EVALUACIÓN POR CRITERIOS

### 3.1 Coherencia Conceptual
- Puntuación: X/10
- Observaciones

### 3.2 Actualización de Información
- Puntuación: X/10
- Observaciones

### 3.3 Profundidad del Contenido
- Puntuación: X/10
- Observaciones

### 3.4 Precisión de Datos
- Puntuación: X/10
- Observaciones

### 3.5 Aplicabilidad Práctica
- Puntuación: X/10
- Observaciones

## 4. RECOMENDACIONES

### 4.1 Mejoras Sugeridas
- Aspectos a fortalecer
- Información a actualizar
- Enfoques a incorporar

### 4.2 Validación de Calidad
- Puntuación general: X/10
- Nivel de confianza: Alto/Medio/Bajo
- Recomendación: Aprobar/Revisar/Rechazar

## 5. CONCLUSIONES
- Síntesis del análisis
- Validación de la investigación
- Próximos pasos recomendados

**NOTA:** Se requiere un análisis objetivo y constructivo que ayude a mejorar la calidad académica del contenido.`;

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
      const resultadoComparacion = data.result;

      // Guardar resultado en la base de datos
      const { error } = await supabase
        .from('comparaciones_sesiones')
        .update({
          resultado_comparacion: resultadoComparacion,
          estado: 'completada',
          fecha_comparacion: new Date().toISOString()
        })
        .eq('id', sesion.comparacion.id);

      if (error) {
        console.error('Error guardando comparación:', error);
        toast.error('Error al guardar la comparación');
        return;
      }

      toast.success('📊 Comparación completada exitosamente');
      
      // Recargar datos
      await cargarSesionesConComparaciones();
      
      if (onRefresh) {
        await onRefresh();
      }

    } catch (error) {
      console.error('Error en comparación:', error);
      toast.error(`Error al realizar la comparación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      // Revertir estado en caso de error
      if (sesion.comparacion?.id) {
        await supabase
          .from('comparaciones_sesiones')
          .update({ estado: 'pendiente' })
          .eq('id', sesion.comparacion.id);
      }
    } finally {
      setComparando(null);
    }
  };

  const mostrarComparacion = (comparacion: ComparacionSesion) => {
    setComparacionMostrada(comparacion.resultado_comparacion || '');
  };

  // Filtrar solo cursos que tienen investigaciones
  const cursosConInvestigaciones = cursos.filter(curso => 
    curso.revision?.estado === 'aprobado' && sesionesData[curso.id!]?.length > 0
  );

  if (cursosConInvestigaciones.length === 0) {
    return (
      <div className="py-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Comparación de Investigaciones</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              No hay investigaciones disponibles para comparación.
            </div>
            <p className="text-sm text-gray-400">
              Primero debes realizar investigaciones en la pestaña "Investigación".
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Comparación de Investigaciones</h2>
      
      {/* Modal para mostrar comparación */}
      {comparacionMostrada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">📊 Análisis Comparativo</h3>
              <button
                onClick={() => setComparacionMostrada(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <MarkdownRenderer content={comparacionMostrada} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-8">
          {cursosConInvestigaciones.map((curso) => {
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
                      {cursoExpandido === curso.id ? '📊 Ocultar Sesiones' : '📊 Comparar Sesiones'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Código: {curso.codigo}</span>
                    <span>Cuenta: {curso.cuenta}</span>
                    <span>Versión: {curso.version}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Con Investigaciones
                    </span>
                  </div>
                </div>
                
                {cursoExpandido === curso.id && (
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Sesiones para Comparación</h4>
                    {sesiones.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {sesiones.map((sesion) => {
                          const comparacionKey = `${curso.id}-${sesion.numero_sesion}`;
                          const estaComparando = comparando === comparacionKey;
                          
                          return (
                            <div key={sesion.numero_sesion} className="bg-white border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">Sesión {sesion.numero_sesion}</h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  sesion.comparacion?.estado === 'completada'
                                    ? 'bg-green-100 text-green-600' 
                                    : sesion.comparacion?.estado === 'procesando'
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {sesion.comparacion?.estado === 'completada' ? 'Completada' : 
                                   sesion.comparacion?.estado === 'procesando' ? 'Procesando' : 'Pendiente'}
                                </span>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <div className="text-xs font-medium text-gray-700 mb-1">
                                    Tema: {sesion.tema_principal}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ✅ Investigación disponible
                                  </div>
                                </div>
                                
                                {/* Subir documentos */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Documento 1
                                    </label>
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) subirDocumento(file, curso.id!, sesion.numero_sesion, 'doc1');
                                      }}
                                      disabled={documentosSubiendo[`${curso.id}-${sesion.numero_sesion}-doc1`]}
                                      className="w-full text-xs border border-gray-300 rounded p-1"
                                    />
                                    {sesion.comparacion?.documento1_nombre && (
                                      <div className="text-xs text-green-600 mt-1">
                                        ✅ {sesion.comparacion.documento1_nombre}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Documento 2
                                    </label>
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) subirDocumento(file, curso.id!, sesion.numero_sesion, 'doc2');
                                      }}
                                      disabled={documentosSubiendo[`${curso.id}-${sesion.numero_sesion}-doc2`]}
                                      className="w-full text-xs border border-gray-300 rounded p-1"
                                    />
                                    {sesion.comparacion?.documento2_nombre && (
                                      <div className="text-xs text-green-600 mt-1">
                                        ✅ {sesion.comparacion.documento2_nombre}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => realizarComparacion(curso, sesion)}
                                    disabled={estaComparando || !sesion.comparacion?.documento1_url || !sesion.comparacion?.documento2_url}
                                    className="flex-1 py-2 px-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {estaComparando ? '🔄 Comparando...' : '📊 Comparar'}
                                  </button>
                                  
                                  {sesion.comparacion?.resultado_comparacion && (
                                    <button
                                      type="button"
                                      onClick={() => mostrarComparacion(sesion.comparacion!)}
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
                        <p>No se encontraron investigaciones para este curso.</p>
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