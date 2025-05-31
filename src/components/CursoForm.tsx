'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface CursoFormProps {
  onSuccess: () => void;
}

export default function CursoForm({ onSuccess }: CursoFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_curso: '',
    version: '',
    fecha_entrega: '',
    archivo: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.archivo) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    try {
      // Subir archivo a Supabase Storage
      const fileExt = formData.archivo.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('archivos')
        .upload(fileName, formData.archivo);

      if (uploadError) throw uploadError;

      // Crear registro en la tabla
      const { error: insertError } = await supabase.from('cursos').insert([
        {
          nombre_curso: formData.nombre_curso,
          version: formData.version,
          fecha_entrega: formData.fecha_entrega,
          archivo_url: data.path,
          archivo_nombre: formData.archivo.name,
        },
      ]);

      if (insertError) throw insertError;

      toast.success('Curso subido exitosamente');
      setFormData({
        nombre_curso: '',
        version: '',
        fecha_entrega: '',
        archivo: null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al subir el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre del Curso</label>
        <input
          type="text"
          required
          value={formData.nombre_curso}
          onChange={(e) =>
            setFormData({ ...formData, nombre_curso: e.target.value })
          }
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Versión</label>
        <input
          type="text"
          required
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Fecha de Entrega</label>
        <input
          type="date"
          required
          value={formData.fecha_entrega}
          onChange={(e) =>
            setFormData({ ...formData, fecha_entrega: e.target.value })
          }
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Archivo</label>
        <input
          type="file"
          onChange={(e) =>
            setFormData({ ...formData, archivo: e.target.files?.[0] || null })
          }
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Subiendo...' : 'Subir Curso'}
      </button>
    </form>
  );
} 