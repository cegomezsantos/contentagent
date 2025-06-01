'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface GraficaStepProps {
  cursos: Curso[];
}

export default function GraficaStep({ cursos }: GraficaStepProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Gráfica</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{curso.nombre_curso}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Recursos Gráficos</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Imágenes
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="w-full p-2 border rounded-lg text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Diagramas
                      </label>
                      <input
                        type="file"
                        multiple
                        accept=".svg,.png,.jpg"
                        className="w-full p-2 border rounded-lg text-gray-700"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Detalles de Diseño</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Paleta de Colores
                      </label>
                      <div className="flex gap-2">
                        <input type="color" className="w-10 h-10" />
                        <input type="color" className="w-10 h-10" />
                        <input type="color" className="w-10 h-10" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Notas de Diseño
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                        placeholder="Instrucciones específicas de diseño..."
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Vista Previa</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <p className="text-gray-700">
                      Área de vista previa de recursos gráficos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 