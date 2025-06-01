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

  const handleDelete = async (id: number | undefined, archivo_url: string) => {
    if (!id || !confirm('¿Estás seguro de que deseas eliminar este curso?')) return;

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
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Nombre del Curso
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Cuenta
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Código
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Versión
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Fecha de Entrega
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Archivo
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cursos.map((curso) => (
            <tr key={curso.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                {curso.nombre_curso}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {curso.cuenta}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {curso.codigo}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {curso.version}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {format(new Date(curso.fecha_entrega), 'dd/MM/yyyy', {
                  locale: es,
                })}
              </td>
              <td className="px-6 py-4 text-sm">
                <button
                  onClick={() =>
                    downloadFile(curso.archivo_url, curso.archivo_nombre)
                  }
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  {curso.archivo_nombre}
                </button>
              </td>
              <td className="px-6 py-4 text-sm">
                <button
                  onClick={() => handleDelete(curso.id, curso.archivo_url)}
                  disabled={loading}
                  className="text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1 rounded-md transition-colors"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {cursos.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                No hay cursos registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 