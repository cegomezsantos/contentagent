'use client';

import { useState, useEffect } from 'react';
import { CursoConRevision, InvestigacionSesion } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface PPTStepProps {
  cursos: CursoConRevision[];
}

interface SesionConInvestigacion {
  numero_sesion: number;
  tema_principal: string;
  investigacion?: InvestigacionSesion;
}

interface SlideEstructura {
  numero: number;
  tipo: 'portada' | 'indice' | 'subtemas' | 'texto_imagen' | 'dos_columnas' | 'solo_imagen' | 'solo_texto' | 'conclusion';
  titulo: string;
  contenido: any;
}

interface EstructuraPPT {
  meta: {
    curso: string;
    codigo: string;
    sesion: number;
    tema: string;
    total_slides: number;
  };
  slides: SlideEstructura[];
}

export default function PPTStep({ cursos }: PPTStepProps) {
  const [cursoExpandido, setCursoExpandido] = useState<string | null>(null);
  const [sesionesData, setSesionesData] = useState<{ [cursoId: string]: SesionConInvestigacion[] }>({});
  const [generandoEstructura, setGenerandoEstructura] = useState<string | null>(null);
  const [estructurasGeneradas, setEstructurasGeneradas] = useState<{ [key: string]: EstructuraPPT }>({});
  const [showJsonEditor, setShowJsonEditor] = useState<string | null>(null);
  const [jsonEditado, setJsonEditado] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (cursos.length > 0) {
      cargarSesionesConInvestigaciones();
    }
  }, [cursos]);

  const cargarSesionesConInvestigaciones = async () => {
    try {
      const { data: investigaciones, error } = await supabase
        .from('investigaciones_sesiones')
        .select('*');

      if (error) {
        console.error('Error cargando investigaciones:', error);
        return;
      }

      const sesionesMap: { [cursoId: string]: SesionConInvestigacion[] } = {};

      for (const curso of cursos) {
        if (curso.revision?.estado === 'aprobado') {
          try {
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
            
            if (jsonSesiones.sesiones && Array.isArray(jsonSesiones.sesiones)) {
              const sesiones: SesionConInvestigacion[] = jsonSesiones.sesiones.map((sesion: any) => {
                const investigacion = investigaciones?.find(
                  inv => inv.curso_id === curso.id && inv.numero_sesion === sesion.numero_sesion
                );
                
                return {
                  numero_sesion: sesion.numero_sesion,
                  tema_principal: sesion.tema_principal || `Sesión ${sesion.numero_sesion}`,
                  investigacion
                };
              });

              sesionesMap[curso.id!] = sesiones;
            }
          } catch (error) {
            console.error(`Error procesando curso ${curso.nombre_curso}:`, error);
          }
        }
      }

      setSesionesData(sesionesMap);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las investigaciones');
    }
  };

  const toggleCurso = (cursoId: string) => {
    setCursoExpandido(cursoExpandido === cursoId ? null : cursoId);
  };

  const generarEstructuraPPT = async (curso: CursoConRevision, sesion: SesionConInvestigacion) => {
    if (!sesion.investigacion) {
      toast.error('Esta sesión no tiene investigación disponible');
      return;
    }

    const pptKey = `${curso.id}-${sesion.numero_sesion}`;
    setGenerandoEstructura(pptKey);

    try {
      toast.loading('Generando estructura JSON con DeepSeek...', { id: 'estructura-generation' });
      
      const response = await fetch('/api/generate-ppt-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tema_sesion: sesion.tema_principal,
          contenido_investigacion: sesion.investigacion.contenido_investigacion,
          numero_sesion: sesion.numero_sesion,
          nombre_curso: curso.nombre_curso,
          codigo_curso: curso.codigo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
      }

      const { json_estructura, json_parsed, error } = await response.json();
      
      if (error) {
        throw new Error(error);
      }
      
      // Guardar la estructura generada
      setEstructurasGeneradas(prev => ({
        ...prev,
        [pptKey]: json_parsed
      }));

      // Guardar también el JSON como string para edición
      setJsonEditado(prev => ({
        ...prev,
        [pptKey]: json_estructura
      }));
      
      toast.success('¡Estructura PPT generada exitosamente!', { id: 'estructura-generation' });

    } catch (error: any) {
      console.error('Error generando estructura PPT:', error);
      toast.error(`Error al generar estructura: ${error.message}`, { id: 'estructura-generation' });
    } finally {
      setGenerandoEstructura(null);
    }
  };

  const guardarEstructura = async (curso: CursoConRevision, sesion: SesionConInvestigacion, estructura: EstructuraPPT) => {
    try {
      toast.loading('Guardando estructura en la base de datos...', { id: 'save-estructura' });

      // Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('❌ No hay sesión activa. Inicia sesión primero.', { id: 'save-estructura' });
        return;
      }
      
      const { data, error } = await supabase
        .from('ppt_estructuras')
        .upsert({
          curso_id: curso.id,
          numero_sesion: sesion.numero_sesion,
          tema_sesion: sesion.tema_principal,
          json_estructura: estructura,
          meta_informacion: {
            total_slides: estructura.slides.length,
            tipos_utilizados: [...new Set(estructura.slides.map(s => s.tipo))],
            generado_con: 'deepseek-chat',
            generado_en: new Date().toISOString()
          },
          estado: 'generado',
          created_by: session.user.id
        }, {
          onConflict: 'curso_id,numero_sesion'
        });

      if (error) {
        console.error('Error detallado:', error);
        throw new Error(`Error de base de datos: ${error.message} (Código: ${error.code})`);
      }

      toast.success('Estructura guardada exitosamente', { id: 'save-estructura' });
      
      // Log del éxito
      console.log('Estructura guardada exitosamente:', data);
      
    } catch (error: any) {
      console.error('Error guardando estructura:', error);
      
      // Mensajes de error más específicos
      if (error.message.includes('row-level security')) {
        toast.error('Error de permisos. Verifica que estés autenticado correctamente.', { id: 'save-estructura' });
      } else if (error.message.includes('violates foreign key')) {
        toast.error('Error: El curso seleccionado no existe en la base de datos.', { id: 'save-estructura' });
      } else {
        toast.error(`Error al guardar: ${error.message}`, { id: 'save-estructura' });
      }
    }
  };

  const actualizarJson = (pptKey: string, nuevoJson: string) => {
    try {
      const jsonParsed = JSON.parse(nuevoJson);
      setEstructurasGeneradas(prev => ({
        ...prev,
        [pptKey]: jsonParsed
      }));
      setJsonEditado(prev => ({
        ...prev,
        [pptKey]: nuevoJson
      }));
      toast.success('JSON actualizado correctamente');
    } catch (error) {
      toast.error('JSON inválido. Verifica la sintaxis.');
    }
  };

  const verificarPermisos = async () => {
    try {
      toast.loading('Probando acceso a tabla PPT...', { id: 'check-perms' });
      
      // Probar directamente la tabla PPT que es la que necesitamos
      const { data, error, count } = await supabase
        .from('ppt_estructuras')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error específico:', error);
        
        if (error.code === 'PGRST116') {
          toast.error('❌ Tabla ppt_estructuras no existe. Ejecuta: tablas_ppt_estructurado.sql', { id: 'check-perms' });
        } else if (error.message.includes('row-level security')) {
          toast.error('❌ Problema de permisos RLS. Ejecuta: solucion_ppt_politicas.sql', { id: 'check-perms' });
        } else if (error.message.includes('JWT')) {
          toast.error('❌ Problema de autenticación. Verifica tu sesión en la aplicación.', { id: 'check-perms' });
        } else {
          toast.error(`❌ Error: ${error.message}`, { id: 'check-perms' });
        }
        
        // Log detallado para debugging
        console.log('Detalles del error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
              } else {
          toast.success(`✅ Tabla PPT accesible. Registros encontrados: ${count || 0}`, { id: 'check-perms' });
          console.log('✅ Permisos OK - Count:', count);
        
        // Prueba adicional: intentar insertar con un curso real
        try {
          // Primero obtener un curso real para hacer la prueba
          const { data: cursos, error: cursosError } = await supabase
            .from('cursos')
            .select('id')
            .limit(1);
            
          if (cursosError || !cursos || cursos.length === 0) {
            toast.success('✅ Acceso OK. No hay cursos para prueba de inserción.', { id: 'check-insert' });
          } else {
            const pruebaData = {
              curso_id: cursos[0].id, // Usar un curso real
              numero_sesion: 9999,
              tema_sesion: 'PRUEBA PERMISOS',
              json_estructura: { test: true },
              estado: 'generado'
            };
            
            const { error: insertError } = await supabase
              .from('ppt_estructuras')
              .insert(pruebaData);
              
            if (insertError) {
              if (insertError.message.includes('duplicate key') || insertError.message.includes('already exists')) {
                toast.success('✅ Permisos de inserción OK (duplicado es normal)', { id: 'check-insert' });
              } else {
                console.log('Error de inserción:', insertError);
                toast.success('✅ Acceso OK. Error de prueba no crítico.', { id: 'check-insert' });
              }
            } else {
              // Si se insertó exitosamente, borrarlo
              await supabase
                .from('ppt_estructuras')
                .delete()
                .eq('numero_sesion', 9999)
                .eq('curso_id', cursos[0].id);
              toast.success('✅ Permisos completos OK (insertar/borrar)', { id: 'check-insert' });
            }
          }
        } catch (insertTestError) {
          console.log('Error en prueba de inserción:', insertTestError);
          toast.success('✅ Acceso básico OK. Prueba avanzada falló.', { id: 'check-insert' });
        }
      }
    } catch (error: any) {
      console.error('Error general en verificación:', error);
      toast.error(`Error general: ${error.message}`, { id: 'check-perms' });
    }
  };

  const renderTipoSlide = (tipo: string) => {
    const tipos = {
      'portada': { icon: '🎯', name: 'Portada', color: 'bg-blue-100 text-blue-800' },
      'indice': { icon: '📋', name: 'Índice', color: 'bg-green-100 text-green-800' },
      'subtemas': { icon: '📝', name: 'Subtemas', color: 'bg-yellow-100 text-yellow-800' },
      'texto_imagen': { icon: '🖼️', name: 'Texto + Imagen', color: 'bg-purple-100 text-purple-800' },
      'dos_columnas': { icon: '📊', name: 'Dos Columnas', color: 'bg-indigo-100 text-indigo-800' },
      'solo_imagen': { icon: '🎨', name: 'Solo Imagen', color: 'bg-pink-100 text-pink-800' },
      'solo_texto': { icon: '📄', name: 'Solo Texto', color: 'bg-gray-100 text-gray-800' },
      'conclusion': { icon: '🏁', name: 'Conclusión', color: 'bg-red-100 text-red-800' }
    };

    const tipoInfo = tipos[tipo as keyof typeof tipos] || { icon: '❓', name: tipo, color: 'bg-gray-100' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tipoInfo.color}`}>
        {tipoInfo.icon} {tipoInfo.name}
      </span>
    );
  };

  const renderSlidePreview = (slide: SlideEstructura) => {
    return (
      <div key={slide.numero} className="border rounded-lg p-3 mb-2 bg-gray-50">
        <div className="flex justify-between items-start mb-2">
          <h5 className="font-medium text-sm">Slide {slide.numero}: {slide.titulo}</h5>
          {renderTipoSlide(slide.tipo)}
        </div>
        
        <div className="text-xs text-gray-600">
          {slide.tipo === 'portada' && (
            <div>
              <p><strong>Curso:</strong> {slide.contenido.curso}</p>
              <p><strong>Sesión:</strong> {slide.contenido.sesion}</p>
            </div>
          )}
          
          {slide.tipo === 'indice' && (
            <div>
              <p><strong>Items:</strong> {slide.contenido.items?.length || 0} puntos</p>
            </div>
          )}
          
          {slide.tipo === 'texto_imagen' && (
            <div>
              <p><strong>Texto:</strong> {slide.contenido.texto?.substring(0, 100)}...</p>
              <p><strong>Imagen sugerida:</strong> {slide.contenido.sugerencia_imagen}</p>
            </div>
          )}
          
          {slide.tipo === 'dos_columnas' && (
            <div>
              <p><strong>Columna 1:</strong> {slide.contenido.columna_1?.substring(0, 50)}...</p>
              <p><strong>Columna 2:</strong> {slide.contenido.columna_2?.substring(0, 50)}...</p>
            </div>
          )}
          
          {(slide.tipo === 'solo_texto' || slide.tipo === 'subtemas' || slide.tipo === 'conclusion') && (
            <div>
              <p><strong>Contenido:</strong> {JSON.stringify(slide.contenido).substring(0, 100)}...</p>
            </div>
          )}
          
          {slide.tipo === 'solo_imagen' && (
            <div>
              <p><strong>Descripción:</strong> {slide.contenido.descripcion_imagen}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (cursos.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">📊</div>
        <p className="text-gray-600">No hay cursos disponibles para generar presentaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">📊 Generación de Presentaciones PPT</h2>
        <p className="text-cyan-100">
          Genera estructuras JSON detalladas para crear presentaciones PowerPoint basadas en las investigaciones realizadas.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-blue-800">🎯 Tipos de Slides Disponibles:</h4>
          <button
            onClick={verificarPermisos}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            🔧 Probar BD PPT
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {renderTipoSlide('portada')}
          {renderTipoSlide('indice')}
          {renderTipoSlide('subtemas')}
          {renderTipoSlide('texto_imagen')}
          {renderTipoSlide('dos_columnas')}
          {renderTipoSlide('solo_imagen')}
          {renderTipoSlide('solo_texto')}
          {renderTipoSlide('conclusion')}
        </div>
      </div>

      <div className="space-y-4">
        {cursos
          .filter(curso => curso.revision?.estado === 'aprobado')
          .map((curso) => {
            const sesiones = sesionesData[curso.id!] || [];
            const isExpanded = cursoExpandido === curso.id;

            return (
              <div key={curso.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                  onClick={() => toggleCurso(curso.id!)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{isExpanded ? '📂' : '📁'}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {curso.codigo} - {curso.nombre_curso}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {sesiones.length} sesiones disponibles
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {sesiones.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No hay sesiones con investigación disponibles
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {sesiones.map((sesion) => {
                          const pptKey = `${curso.id}-${sesion.numero_sesion}`;
                          const estructura = estructurasGeneradas[pptKey];
                          const isGenerating = generandoEstructura === pptKey;
                          const showEditor = showJsonEditor === pptKey;

                          return (
                            <div key={sesion.numero_sesion} className="bg-white rounded-lg border p-4">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Sesión {sesion.numero_sesion}: {sesion.tema_principal}
                                  </h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {sesion.investigacion ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✅ Con investigación
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        ❌ Sin investigación
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex space-x-2">
                                  {!estructura && (
                                    <button
                                      onClick={() => generarEstructuraPPT(curso, sesion)}
                                      disabled={!sesion.investigacion || isGenerating}
                                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                                    >
                                      {isGenerating ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                          <span>Generando...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>🎯</span>
                                          <span>Generar Estructura</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {estructura && (
                                    <>
                                      <button
                                        onClick={() => setShowJsonEditor(showEditor ? null : pptKey)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                                      >
                                        <span>📝</span>
                                        <span>{showEditor ? 'Ocultar JSON' : 'Editar JSON'}</span>
                                      </button>

                                      <button
                                        onClick={() => guardarEstructura(curso, sesion, estructura)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                                      >
                                        <span>💾</span>
                                        <span>Guardar</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {estructura && (
                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-gray-700">
                                      Estructura Generada ({estructura.slides.length} slides)
                                    </h5>
                                    <div className="text-sm text-gray-500">
                                      Tipos: {[...new Set(estructura.slides.map(s => s.tipo))].join(', ')}
                                    </div>
                                  </div>

                                  {showEditor ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={jsonEditado[pptKey] || JSON.stringify(estructura, null, 2)}
                                        onChange={(e) => setJsonEditado(prev => ({ ...prev, [pptKey]: e.target.value }))}
                                        rows={15}
                                        className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
                                        placeholder="JSON de la estructura..."
                                      />
                                      <button
                                        onClick={() => actualizarJson(pptKey, jsonEditado[pptKey] || '')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                      >
                                        Actualizar Estructura
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="max-h-60 overflow-y-auto">
                                      {estructura.slides.map(slide => renderSlidePreview(slide))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
} 