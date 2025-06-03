'use client';

import { useState } from 'react';
import { CursoConRevision } from '@/types';

interface ComparacionStepProps {
  cursos: CursoConRevision[];
}

export default function ComparacionStep({ cursos }: ComparacionStepProps) {
  const [informeExpandido, setInformeExpandido] = useState<string | null>(null);
  const [archivosComparacion, setArchivosComparacion] = useState<{[key: string]: {comparacion1?: File, comparacion2?: File}}>({});

  const handleArchivoChange = (cursoId: string, tipo: 'comparacion1' | 'comparacion2', archivo: File | null) => {
    setArchivosComparacion(prev => ({
      ...prev,
      [cursoId]: {
        ...prev[cursoId],
        [tipo]: archivo || undefined
      }
    }));
  };

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Comparación</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-8">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-6 bg-gray-50">
              {/* Título del curso */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {curso.nombre_curso}
                </h3>
                
                {/* Datos del curso */}
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <span>Código: {curso.codigo}</span>
                  <span>Cuenta: {curso.cuenta}</span>
                  <span>Versión: {curso.version}</span>
                </div>
              </div>

              {/* Botón Investigación base */}
              <div className="mb-6">
                <button
                  type="button"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  onClick={() => {
                    // TODO: Implementar funcionalidad para mostrar documento de investigación base
                    console.log(`Mostrando investigación base del curso ${curso.id}`);
                  }}
                >
                  📄 Investigación base
                </button>
              </div>

              {/* Campos de subida de archivos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Comparación 1 */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Comparación 1
                  </label>
                  <input
                    type="file"
                    accept=".docx,.pdf,.txt"
                    onChange={(e) => handleArchivoChange(curso.id!, 'comparacion1', e.target.files?.[0] || null)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {archivosComparacion[curso.id!]?.comparacion1 && (
                    <p className="text-sm text-green-600">
                      ✓ {archivosComparacion[curso.id!].comparacion1!.name}
                    </p>
                  )}
                </div>

                {/* Comparación 2 */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Comparación 2
                  </label>
                  <input
                    type="file"
                    accept=".docx,.pdf,.txt"
                    onChange={(e) => handleArchivoChange(curso.id!, 'comparacion2', e.target.files?.[0] || null)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {archivosComparacion[curso.id!]?.comparacion2 && (
                    <p className="text-sm text-green-600">
                      ✓ {archivosComparacion[curso.id!].comparacion2!.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Botón Ver informe comparación */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setInformeExpandido(informeExpandido === curso.id ? null : curso.id!)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {informeExpandido === curso.id ? '📊 Ocultar informe comparación' : '📊 Ver informe comparación'}
                </button>
              </div>

              {/* Informe de comparación (desplegable) */}
              {informeExpandido === curso.id && (
                <div className="p-6 bg-white rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-gray-900 mb-4">📊 Informe de Comparación</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Documento 1 - Análisis</h5>
                        <div className="p-4 bg-gray-50 rounded-lg text-sm">
                          <p className="text-gray-600">Análisis del primer documento aparecerá aquí...</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Documento 2 - Análisis</h5>
                        <div className="p-4 bg-gray-50 rounded-lg text-sm">
                          <p className="text-gray-600">Análisis del segundo documento aparecerá aquí...</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Comparación y Diferencias</h5>
                      <div className="p-4 bg-gray-50 rounded-lg text-sm">
                        <p className="text-gray-600">El informe comparativo detallado aparecerá aquí una vez que se procesen los documentos...</p>
                      </div>
                    </div>
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