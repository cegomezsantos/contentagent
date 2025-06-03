'use client';

import { useState } from 'react';
import { CursoConRevision } from '@/types';

interface PPTStepProps {
  cursos: CursoConRevision[];
}

export default function PPTStep({ cursos }: PPTStepProps) {
  const [cursoExpandido, setCursoExpandido] = useState<string | null>(null);
  const sesiones = Array.from({ length: 8 }, (_, i) => i + 1);

  const toggleCurso = (cursoId: string) => {
    setCursoExpandido(cursoExpandido === cursoId ? null : cursoId);
  };

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Presentaciones PPT</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-8">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-6 bg-gray-50">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{curso.nombre_curso}</h3>
                  <button
                    type="button"
                    onClick={() => toggleCurso(curso.id!)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    {cursoExpandido === curso.id ? '📊 Ocultar Sesiones' : '📊 Generar PPT de sesiones'}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Código: {curso.codigo}</span>
                  <span>Cuenta: {curso.cuenta}</span>
                  <span>Versión: {curso.version}</span>
                </div>
              </div>
              
              {cursoExpandido === curso.id && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Sesiones del Curso</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sesiones.map((sesion) => (
                      <div key={sesion} className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Sesión {sesion}</h5>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Pendiente
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Tema de la Sesión
                            </label>
                            <textarea
                              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={3}
                              placeholder="Describe el tema completo de esta sesión..."
                            />
                          </div>
                          
                          <button
                            type="button"
                            className="w-full py-2 px-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            onClick={() => {
                              // TODO: Implementar funcionalidad
                              console.log(`Procesando sesión ${sesion} del curso ${curso.id}`);
                            }}
                          >
                            📊 Generar PPT
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 