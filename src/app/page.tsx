'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { CursoConRevision } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import TabNavigation from '@/components/TabNavigation';
import UploadStep from '@/components/steps/UploadStep';
import ViewStep from '@/components/steps/ViewStep';
import RevisionStep from '@/components/steps/RevisionStep';
import InvestigacionStep from '@/components/steps/InvestigacionStep';
import ComparacionStep from '@/components/steps/ComparacionStep';
import ActividadesStep from '@/components/steps/ActividadesStep';
import PPTStep from '@/components/steps/PPTStep';
import RevisoresStep from '@/components/steps/RevisoresStep';
import GraficaStep from '@/components/steps/GraficaStep';

const TABS = [
  { id: 'upload', label: 'Subir Curso', step: 1 },
  { id: 'view', label: 'Ver Cursos', step: 2 },
  { id: 'revision', label: 'Revisión Sílabos', step: 3 },
  { id: 'investigacion', label: 'Investigación', step: 4 },
  { id: 'comparacion', label: 'Comparación', step: 5 },
  { id: 'actividades', label: 'Actividades', step: 6 },
  { id: 'ppt', label: 'PPT', step: 7 },
  { id: 'revisores', label: 'Revisores', step: 8 },
  { id: 'grafica', label: 'Gráfica', step: 9 },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [cursos, setCursos] = useState<CursoConRevision[]>([]);

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      // Obtener cursos
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false });

      if (cursosError) {
        console.error('Error fetching cursos:', cursosError);
        return;
      }

      // Obtener todas las revisiones
      const { data: revisiones, error: revisionesError } = await supabase
        .from('revision_silabus')
        .select('*');

      if (revisionesError) {
        console.error('Error fetching revisiones:', revisionesError);
      }

      // Combinar cursos con sus revisiones
      const cursosConRevision: CursoConRevision[] = (cursosData || []).map(curso => {
        const revision = revisiones?.find(r => r.curso_id === curso.id);
        return {
          ...curso,
          revision: revision || undefined
        };
      });

      console.log('📚 Cursos cargados con revisiones:', cursosConRevision); // LOG para debug
      setCursos(cursosConRevision);
    } catch (error) {
      console.error('Error en fetchCursos:', error);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <UploadStep
            onSuccess={fetchCursos}
            onNext={() => setActiveTab('view')}
          />
        );
      case 'view':
        return <ViewStep cursos={cursos} onUpdate={fetchCursos} />;
      case 'revision':
        return <RevisionStep cursos={cursos} />;
      case 'investigacion':
        return <InvestigacionStep cursos={cursos} onRefresh={fetchCursos} />;
      case 'comparacion':
        return <ComparacionStep cursos={cursos} onRefresh={fetchCursos} />;
      case 'actividades':
        return <ActividadesStep cursos={cursos} onRefresh={fetchCursos} />;
      case 'ppt':
        return <PPTStep cursos={cursos} />;
      case 'revisores':
        return <RevisoresStep cursos={cursos} />;
      case 'grafica':
        return <GraficaStep cursos={cursos} />;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Agente contenidos</h1>
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <TabNavigation
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
          <div className="p-4">{renderActiveTab()}</div>
        </div>
        <Toaster />
      </main>
    </ProtectedRoute>
  );
}
