'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Curso } from '@/types';

interface CursoTableProps {
  cursos: Curso[];
  onUpdate: () => void;
}

export default function CursoTable({ cursos, onUpdate }: CursoTableProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id: string, archivo_url: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso?')) return;

    setLoading(true);
    try {
      // Eliminar archivo de Storage
      const { error: storageError } = await supabase.storage
        .from('archivos')
        .remove([archivo_url]);

      if (storageError) throw storageError;

      // Eliminar registro de la tabla
      const { error: deleteError } = await supabase
        .from('cursos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Curso eliminado exitosamente');
      onUpdate();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el curso');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (archivo_url: string, archivo_nombre: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('archivos')
        .download(archivo_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = archivo_nombre;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre del Curso
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Versión
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha de Entrega
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Archivo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cursos.map((curso) => (
            <tr key={curso.id}>
              <td className="px-6 py-4 whitespace-nowrap">{curso.nombre_curso}</td>
              <td className="px-6 py-4 whitespace-nowrap">{curso.version}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {format(new Date(curso.fecha_entrega), 'dd/MM/yyyy', {
                  locale: es,
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() =>
                    downloadFile(curso.archivo_url, curso.archivo_nombre)
                  }
                  className="text-blue-600 hover:text-blue-800"
                >
                  {curso.archivo_nombre}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleDelete(curso.id, curso.archivo_url)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 