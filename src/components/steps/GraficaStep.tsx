'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface GraficaStepProps {
  cursos: Curso[];
}

export default function GraficaStep({ cursos }: GraficaStepProps) {
  const [cursosExpandidos, setCursosExpandidos] = useState<{ [cursoId: string]: boolean }>({});

  const toggleCurso = (cursoId: string) => {
    setCursosExpandidos(prev => ({
      ...prev,
      [cursoId]: !prev[cursoId]
    }));
  };

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Gráfica</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-4 bg-gray-50">
              {/* Vista colapsada */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{curso.nombre_curso}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>Código: {curso.codigo}</span>
                    <span>Cuenta: {curso.cuenta}</span>
                    <span>Versión: {curso.version}</span>
                  </div>
                  
                  {/* Estado resumido */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚧</span>
                    <span className="text-sm font-medium text-gray-700">En proceso de construcción</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleCurso(curso.id!)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {cursosExpandidos[curso.id!] ? '▲ Ocultar Detalles' : '▼ Ver Detalles'}
                </button>
              </div>

              {/* Vista expandida */}
              {cursosExpandidos[curso.id!] && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🚧</div>
                      <h4 className="text-lg font-medium text-gray-700 mb-2">
                        En proceso de construcción
                      </h4>
                      <p className="text-sm text-gray-500">
                        Esta funcionalidad está siendo desarrollada y estará disponible próximamente.
                      </p>
                      <div className="mt-4">
                        <p className="text-xs text-gray-400">
                          Aquí se mostrarán las gráficas y recursos visuales del curso.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {cursos.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500">No hay cursos disponibles para mostrar gráficas.</p>
          </div>
        )}
      </div>
    </div>
  );
} 