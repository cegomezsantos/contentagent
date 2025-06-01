'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Curso } from '@/types';
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
  { id: 'upload', label: 'Subir Curso' },
  { id: 'view', label: 'Ver Cursos' },
  { id: 'revision', label: 'Revisión Sílabos' },
  { id: 'investigacion', label: 'Investigación' },
  { id: 'comparacion', label: 'Comparación' },
  { id: 'actividades', label: 'Actividades' },
  { id: 'ppt', label: 'PPT' },
  { id: 'revisores', label: 'Revisores' },
  { id: 'grafica', label: 'Gráfica' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
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
        return <InvestigacionStep cursos={cursos} />;
      case 'comparacion':
        return <ComparacionStep cursos={cursos} />;
      case 'actividades':
        return <ActividadesStep cursos={cursos} />;
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
        <h1 className="text-3xl font-bold mb-8">Gestión de Cursos</h1>
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
