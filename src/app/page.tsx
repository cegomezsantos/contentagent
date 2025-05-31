'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import CursoForm from '@/components/CursoForm';
import CursoTable from '@/components/CursoTable';
import { Curso } from '@/types';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [cursos, setCursos] = useState<Curso[]>([]);

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cursos:', error);
      return;
    }

    setCursos(data || []);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestión de Cursos</h1>
      <CursoForm onSuccess={fetchCursos} />
      <div className="mt-8">
        <CursoTable cursos={cursos} onUpdate={fetchCursos} />
      </div>
      <Toaster />
    </main>
  );
}
