'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface ActividadesStepProps {
  cursos: Curso[];
}

export default function ActividadesStep({ cursos }: ActividadesStepProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Actividades</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{curso.nombre_curso}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Actividades Prácticas</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Título de la Actividad
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg text-gray-700"
                        placeholder="Nombre de la actividad..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                        placeholder="Describe la actividad..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Objetivos de Aprendizaje
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                        placeholder="Objetivos que se buscan alcanzar..."
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Evaluaciones</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Tipo de Evaluación
                      </label>
                      <select className="w-full p-2 border rounded-lg text-gray-700">
                        <option value="">Selecciona un tipo...</option>
                        <option value="practica">Práctica Calificada</option>
                        <option value="proyecto">Proyecto</option>
                        <option value="examen">Examen</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Criterios de Evaluación
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-lg min-h-[100px] text-gray-700"
                        placeholder="Define los criterios de evaluación..."
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