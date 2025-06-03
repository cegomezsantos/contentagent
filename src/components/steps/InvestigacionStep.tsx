'use client';

import { useState, useEffect } from 'react';
import { CursoConRevision, RevisionSilabo } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface InvestigacionStepProps {
  cursos: CursoConRevision[];
}

export default function InvestigacionStep({ cursos }: InvestigacionStepProps) {
  const [cursosAprobados, setCursosAprobados] = useState<CursoConRevision[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarCursosAprobados();
  }, [cursos]);

  const cargarCursosAprobados = async () => {
    try {
      setCargando(true);
      
      // Obtener solo las revisiones aprobadas
      const { data: revisionesAprobadas, error } = await supabase
        .from('revision_silabus')
        .select('*')
        .eq('estado', 'aprobado');

      if (error) {
        console.error('Error cargando revisiones aprobadas:', error);
        toast.error('Error al cargar los cursos aprobados');
        return;
      }

      // Filtrar cursos que tienen revisión aprobada
      const cursosConAprobacion = cursos.filter(curso => 
        revisionesAprobadas?.some(revision => revision.curso_id === curso.id?.toString())
      ).map(curso => {
        const revision = revisionesAprobadas?.find(r => r.curso_id === curso.id?.toString());
        return {
          ...curso,
          revision: revision || undefined
        };
      });

      setCursosAprobados(cursosConAprobacion);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="py-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Investigación</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Cargando cursos aprobados...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Investigación</h2>
      
      {cursosAprobados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos aprobados</h3>
            <p className="text-gray-500">
              Primero debes aprobar algunos sílabos en la pestaña "Revisión Sílabos" para que aparezcan aquí.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cursos Aprobados para Investigación
            </h3>
            <p className="text-sm text-gray-600">
              {cursosAprobados.length} curso{cursosAprobados.length !== 1 ? 's' : ''} aprobado{cursosAprobados.length !== 1 ? 's' : ''} disponible{cursosAprobados.length !== 1 ? 's' : ''} para investigación
            </p>
          </div>
          
          <div className="space-y-6">
            {cursosAprobados.map((curso) => (
              <div key={curso.id} className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{curso.nombre_curso}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">Código: {curso.codigo}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Aprobado
                      </span>
                    </div>
                  </div>
                  {curso.revision && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Aprobado el: {new Date(curso.revision.fecha_revision).toLocaleDateString('es-ES')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Por: {curso.revision.revisor || 'Sistema'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Fuentes de Investigación
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enlaces, libros, papers, bases de datos académicas..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Palabras Clave de Búsqueda
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Términos relevantes para la investigación..."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Hallazgos Principales
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Puntos clave encontrados, tendencias, innovaciones..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Aplicabilidad al Curso
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg min-h-[80px] text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Cómo pueden aplicarse estos hallazgos al curso..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Notas Adicionales y Observaciones
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg min-h-[80px] text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observaciones generales, ideas para futuras investigaciones..."
                  />
                </div>
                
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Guardar Investigación
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 