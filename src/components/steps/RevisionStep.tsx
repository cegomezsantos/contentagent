'use client';

import { useState } from 'react';
import { Curso } from '@/types';

interface RevisionStepProps {
  cursos: Curso[];
}

export default function RevisionStep({ cursos }: RevisionStepProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Revisión de Sílabos</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Verificación</h3>
          <div className="grid gap-4">
            {cursos.map((curso) => (
              <div key={curso.id} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{curso.nombre_curso}</h4>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center space-x-2 text-gray-700">
                    <input type="checkbox" className="form-checkbox text-blue-600" />
                    <span>Objetivos del curso</span>
                  </label>
                  <label className="flex items-center space-x-2 text-gray-700">
                    <input type="checkbox" className="form-checkbox text-blue-600" />
                    <span>Contenido temático</span>
                  </label>
                  <label className="flex items-center space-x-2 text-gray-700">
                    <input type="checkbox" className="form-checkbox text-blue-600" />
                    <span>Metodología</span>
                  </label>
                  <label className="flex items-center space-x-2 text-gray-700">
                    <input type="checkbox" className="form-checkbox text-blue-600" />
                    <span>Sistema de evaluación</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 