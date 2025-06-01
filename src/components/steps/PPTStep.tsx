'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface PPTStepProps {
  cursos: Curso[];
}

export default function PPTStep({ cursos }: PPTStepProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Presentaciones PPT</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{curso.nombre_curso}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Subir Presentación</h4>
                  <input
                    type="file"
                    accept=".ppt,.pptx"
                    className="w-full p-2 border rounded-lg text-gray-700"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Detalles de la Presentación</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Tema/Unidad
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg text-gray-700"
                        placeholder="Nombre del tema o unidad..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                        placeholder="Describe el contenido de la presentación..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Notas del Presentador
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                        placeholder="Notas adicionales para el presentador..."
                      />
                    </div>
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