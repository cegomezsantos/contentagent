'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface InvestigacionStepProps {
  cursos: Curso[];
}

export default function InvestigacionStep({ cursos }: InvestigacionStepProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Investigación</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{curso.nombre_curso}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Fuentes de Investigación
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                    placeholder="Enlaces, libros, papers..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Hallazgos Principales
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                    placeholder="Puntos clave encontrados..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Notas Adicionales
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                    placeholder="Observaciones, ideas..."
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