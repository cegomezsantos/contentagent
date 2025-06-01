'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface UploadStepProps {
  onSuccess: () => void;
  onNext: () => void;
}

export default function UploadStep({ onSuccess, onNext }: UploadStepProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_curso: '',
    version: '',
    fecha_entrega: '',
    archivo: null as File | null,
    cuenta: '',
    codigo: '',
  });

  const tiposCuenta = ['ejecutiva', 'pregrado', 'Harson', 'escuela'];

  const validarCodigo = async (codigo: string) => {
    try {
      if (codigo.length !== 5 || !/^\d+$/.test(codigo)) {
        return 'El código debe tener exactamente 5 dígitos';
      }

      const { data, error } = await supabase
        .from('cursos')
        .select('codigo')
        .eq('codigo', codigo)
        .maybeSingle();

      if (error) {
        console.error('Error al validar código:', error.message, error.details);
        return `Error al validar el código: ${error.message}`;
      }

      if (data) {
        return 'Este código ya existe';
      }

      return null;
    } catch (error) {
      console.error('Error inesperado al validar código:', error);
      return 'Error inesperado al validar el código';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar versión
    const version = parseInt(formData.version);
    if (isNaN(version) || version < 1 || version > 10) {
      toast.error('La versión debe ser un número entre 1 y 10');
      return;
    }

    // Validar código
    const codigoError = await validarCodigo(formData.codigo);
    if (codigoError) {
      toast.error(codigoError);
      return;
    }

    if (!formData.archivo) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    try {
      const fileExt = formData.archivo.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('archivos')
        .upload(fileName, formData.archivo);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('cursos').insert([
        {
          nombre_curso: formData.nombre_curso,
          version: parseInt(formData.version),
          fecha_entrega: formData.fecha_entrega,
          archivo_url: data.path,
          archivo_nombre: formData.archivo.name,
          cuenta: formData.cuenta,
          codigo: formData.codigo,
        },
      ]);

      if (insertError) {
        console.error('Error al insertar curso:', insertError.message, insertError.details);
        throw new Error(`Error al insertar curso: ${insertError.message}`);
      }

      toast.success('Curso subido exitosamente');
      setFormData({
        nombre_curso: '',
        version: '',
        fecha_entrega: '',
        archivo: null,
        cuenta: '',
        codigo: '',
      });
      onSuccess();
      onNext();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Subir Nuevo Curso</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Nombre del Curso
          </label>
          <input
            type="text"
            required
            value={formData.nombre_curso}
            onChange={(e) =>
              setFormData({ ...formData, nombre_curso: e.target.value })
            }
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Cuenta
            </label>
            <select
              required
              value={formData.cuenta}
              onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            >
              <option value="">Seleccionar cuenta</option>
              {tiposCuenta.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Código
            </label>
            <input
              type="text"
              required
              maxLength={5}
              pattern="\d{5}"
              value={formData.codigo}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                setFormData({ ...formData, codigo: value });
              }}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              placeholder="12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Versión
            </label>
            <input
              type="number"
              required
              min="1"
              max="10"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              placeholder="1-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Fecha de Entrega
          </label>
          <input
            type="date"
            required
            value={formData.fecha_entrega}
            onChange={(e) =>
              setFormData({ ...formData, fecha_entrega: e.target.value })
            }
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Subir Sílabo del Curso
          </label>
          <input
            type="file"
            onChange={(e) =>
              setFormData({ ...formData, archivo: e.target.files?.[0] || null })
            }
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Subiendo...' : 'Subir y Continuar'}
          </button>
        </div>
      </form>
    </div>
  );
} 