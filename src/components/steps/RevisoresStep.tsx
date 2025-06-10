'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface RevisoresStepProps {
  cursos: Curso[];
}

export default function RevisoresStep({ cursos }: RevisoresStepProps) {
  const [revisoresData, setRevisoresData] = useState<{ [cursoId: string]: any }>({});
  const [cursosExpandidos, setCursosExpandidos] = useState<{ [cursoId: string]: boolean }>({});

  const estadosRevision = [
    { value: 'EN_PROCESO', label: 'EN PROCESO' },
    { value: 'APROBADO', label: 'APROBADO' },
    { value: 'APROBADO_CON_OBSERVACIONES', label: 'APROBADO CON OBSERVACIONES' },
    { value: 'RECHAZADO', label: 'RECHAZADO' }
  ];

  const handleInputChange = (cursoId: string, field: string, value: string) => {
    setRevisoresData(prev => ({
      ...prev,
      [cursoId]: {
        ...prev[cursoId],
        [field]: value
      }
    }));
  };

  const toggleCurso = (cursoId: string) => {
    setCursosExpandidos(prev => ({
      ...prev,
      [cursoId]: !prev[cursoId]
    }));
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'EN_PROCESO':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROBADO':
        return 'bg-green-100 text-green-800';
      case 'APROBADO_CON_OBSERVACIONES':
        return 'bg-blue-100 text-blue-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Revisores</h2>
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
                  
                  {/* Información resumida */}
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Fecha Límite: </span>
                      <span className="text-sm text-gray-600">
                        {revisoresData[curso.id!]?.fecha_limite || 'No definida'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Estado: </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getColorEstado(revisoresData[curso.id!]?.estado_revision)
                      }`}>
                        {revisoresData[curso.id!]?.estado_revision ? 
                          estadosRevision.find(e => e.value === revisoresData[curso.id!]?.estado_revision)?.label || 'Sin definir'
                          : 'Sin definir'
                        }
                      </span>
                    </div>
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
                  <div className="space-y-6">
                    {/* Información del Revisor */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium mb-4 text-gray-900">Información del Revisor</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Nombre del Revisor *
                          </label>
                          <input
                            type="text"
                            value={revisoresData[curso.id!]?.nombre_revisor || ''}
                            onChange={(e) => handleInputChange(curso.id!, 'nombre_revisor', e.target.value)}
                            className="w-full p-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nombre completo del revisor..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            DNI *
                          </label>
                          <input
                            type="text"
                            maxLength={8}
                            value={revisoresData[curso.id!]?.dni || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              handleInputChange(curso.id!, 'dni', value);
                            }}
                            className="w-full p-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="12345678"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Teléfono *
                          </label>
                          <input
                            type="tel"
                            value={revisoresData[curso.id!]?.telefono || ''}
                            onChange={(e) => handleInputChange(curso.id!, 'telefono', e.target.value)}
                            className="w-full p-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+51 999 999 999"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Correo Electrónico *
                          </label>
                          <input
                            type="email"
                            value={revisoresData[curso.id!]?.correo || ''}
                            onChange={(e) => handleInputChange(curso.id!, 'correo', e.target.value)}
                            className="w-full p-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="revisor@ejemplo.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Información de Revisión */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium mb-4 text-gray-900">Información de Revisión</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Fecha Límite de Revisión *
                          </label>
                          <input
                            type="date"
                            value={revisoresData[curso.id!]?.fecha_limite || ''}
                            onChange={(e) => handleInputChange(curso.id!, 'fecha_limite', e.target.value)}
                            className="w-full p-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Estado de Revisión *
                          </label>
                          <select 
                            value={revisoresData[curso.id!]?.estado_revision || ''}
                            onChange={(e) => handleInputChange(curso.id!, 'estado_revision', e.target.value)}
                            className="w-full p-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleccionar estado...</option>
                            {estadosRevision.map((estado) => (
                              <option key={estado.value} value={estado.value}>
                                {estado.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Comentarios */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium mb-4 text-gray-900">Comentarios de Revisión</h4>
                      <textarea
                        value={revisoresData[curso.id!]?.comentarios || ''}
                        onChange={(e) => handleInputChange(curso.id!, 'comentarios', e.target.value)}
                        className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Comentarios, observaciones y sugerencias del revisor..."
                      />
                    </div>

                    {/* Botón de guardar */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        onClick={() => {
                          // TODO: Implementar funcionalidad de guardar
                          console.log('Guardando datos del revisor para curso:', curso.id, revisoresData[curso.id!]);
                        }}
                      >
                        💾 Guardar Información
                      </button>
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