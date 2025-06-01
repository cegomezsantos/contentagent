'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface ComparacionStepProps {
  cursos: Curso[];
}

export default function ComparacionStep({ cursos }: ComparacionStepProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Comparación</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{curso.nombre_curso}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Versión Anterior</h4>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Contenido
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                      placeholder="Contenido anterior..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Metodología
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                      placeholder="Metodología anterior..."
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Nueva Versión</h4>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Contenido
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                      placeholder="Nuevo contenido..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Metodología
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                      placeholder="Nueva metodología..."
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Cambios Significativos
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                  placeholder="Describe los cambios más importantes..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 