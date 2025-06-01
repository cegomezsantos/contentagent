'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface RevisoresStepProps {
  cursos: Curso[];
}

export default function RevisoresStep({ cursos }: RevisoresStepProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Revisores</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{curso.nombre_curso}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Asignar Revisores</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Revisor Principal
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg text-gray-700"
                        placeholder="Nombre del revisor principal..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Revisor Secundario
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg text-gray-700"
                        placeholder="Nombre del revisor secundario..."
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Estado de Revisión</h4>
                  <div className="space-y-2">
                    <select className="w-full p-2 border rounded-lg text-gray-700">
                      <option value="">Seleccionar estado...</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="en_revision">En Revisión</option>
                      <option value="revisado">Revisado</option>
                      <option value="aprobado">Aprobado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Comentarios de Revisión</h4>
                  <textarea
                    className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                    placeholder="Comentarios y observaciones de los revisores..."
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Fecha Límite</h4>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg text-gray-700"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 