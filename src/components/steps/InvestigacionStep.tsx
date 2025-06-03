'use client';

import { useState, useEffect } from 'react';
import { CursoConRevision, RevisionSilabo } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface InvestigacionStepProps {
  cursos: CursoConRevision[];
}

export default function InvestigacionStep({ cursos }: InvestigacionStepProps) {
  const [cursosAprobados, setCursosAprobados] = useState<CursoConRevision[]>([]);
  const [cargando, setCargando] = useState(true);
  const [informeExpandido, setInformeExpandido] = useState<string | null>(null);

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
        revisionesAprobadas?.some(revision => revision.curso_id === curso.id)
      ).map(curso => {
        const revision = revisionesAprobadas?.find(r => r.curso_id === curso.id);
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
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{curso.nombre_curso}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Código:</span> {curso.codigo}
                      </div>
                      <div>
                        <span className="font-medium">Cuenta:</span> {curso.cuenta}
                      </div>
                      <div>
                        <span className="font-medium">Versión:</span> {curso.version}
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Aprobado
                        </span>
                      </div>
                    </div>
                    {curso.revision && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>Aprobado el: {new Date(curso.revision.fecha_revision).toLocaleDateString('es-ES')}</span>
                        <span>Por: {curso.revision.revisor || 'Sistema'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  {curso.revision && (
                    <>
                      <button
                        onClick={() => setInformeExpandido(informeExpandido === curso.id ? null : curso.id!)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {informeExpandido === curso.id ? '📄 Ocultar Informe' : '📄 Ver Informe Completo'}
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implementar funcionalidad de investigación
                          toast.success('Función de investigación en desarrollo');
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        🔍 Investigar
                      </button>
                    </>
                  )}
                </div>
                
                {/* Informe desplegable */}
                {informeExpandido === curso.id && curso.revision && (
                  <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-gray-900 mb-3">📋 Informe de Revisión Completo</h4>
                    <div className="max-h-96 overflow-y-auto">
                      <MarkdownRenderer content={curso.revision.informe_revision} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 