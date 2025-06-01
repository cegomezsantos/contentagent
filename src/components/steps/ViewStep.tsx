'use client';

import CursoTable from '../CursoTable';
import { Curso } from '@/types';

interface ViewStepProps {
  cursos: Curso[];
  onUpdate: () => void;
}

export default function ViewStep({ cursos, onUpdate }: ViewStepProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#646464' }}>Cursos Registrados</h2>
      <CursoTable cursos={cursos} onUpdate={onUpdate} />
    </div>
  );
} 