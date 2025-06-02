'use client';

import { useState } from 'react';
import { Curso } from '@/types';
import toast from 'react-hot-toast';

interface RevisionStepProps {
  cursos: Curso[];
}

interface SesionTema {
  sesion: string;
  temas: string[];
}

interface AnalisisResultado {
  objetivoGeneral: string;
  objetivosEspecificos: string;
  contenidos: string;
  softwareRecursos: string;
  bibliografia: string;
  sesiones: SesionTema[];
}

export default function RevisionStep({ cursos }: RevisionStepProps) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState<Curso | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisResultado | null>(null);
  const [apiKey, setApiKey] = useState('');

  const analizarSilabo = async () => {
    if (!cursoSeleccionado) {
      toast.error('Por favor selecciona un curso para analizar');
      return;
    }

    if (!apiKey.trim()) {
      toast.error('Por favor ingresa tu API Key de DeepSeek');
      return;
    }

    setAnalizando(true);
    
    try {
      // Obtener el contenido del documento desde Supabase
      const response = await fetch(cursoSeleccionado.archivo_url);
      const documentoTexto = await response.text();

      // Primer análisis: Revisión general del sílabo
      const promptRevision = `Rol
Actúa como un experto en diseño curricular con amplia experiencia en la elaboración y evaluación de programas de nivel superior, especializado en la metodología «Aprende Haciendo» y en la ingeniería de prompts.

Tarea
Analiza el sílabo que proporcionará el usuario exclusivamente en las secciones:
- Objetivo general
- Objetivos específicos
- Contenidos (incluye actividades, secuencia y carga)
- "Software y recursos educativos utilizados"
- Bibliografía

No analices Metodología ni Evaluación (ignóralas por completo).

🛑 A diferencia de la versión original, no debes re-escribir el sílabo; solo emite observaciones y recomendaciones sobre los aspectos que requieran mejora.

FORMATO DEL INFORME – «Informe de Observaciones»
Entrega las secciones en el orden que sigue.
En cada una:
- Si no hay problemas, escribe (Sin observaciones).
- Si existen problemas, enumera observaciones concisas en viñetas (máx. 3 líneas por viñeta).

Objetivo general
- Conjugación y verbo (infinitivo / 2.ª persona)
- Acción-conocimiento-contexto: precisión y pertinencia
- Verbo adecuado según lista recomendada

Objetivos específicos
- Producto observable / aprendizaje tangible
- Verbos accionables («Aplicar», «Demostrar», etc.)
- Orden lógico de progresión (simple → complejo)

Contenidos
- Correspondencia Objetivos ↔ Contenidos: escribe antes de cualquier tabla uno de los tres veredictos exactamente así: correcta / parcial / incorrecta.
- Si el veredicto es parcial o incorrecta, añade solo las actividades mal vinculadas en la siguiente tabla:
  [Objetivo(s) afectado(s)] | [Problema detectado]
- División en sesiones, subtemas y actividades
- Secuencia temática y carga horaria (densidad)

Software y recursos educativos utilizados
- Presencia y formato de dos columnas
- Cobertura de herramientas críticas y versiones

Bibliografía
- Formato (APA 7)
- Actualización (preferir ediciones ≥ 2023)
- Cobertura temática suficiente

Reglas de estilo
- Sé directo, profesional y específico.
- No incluyas frases elogiosas ni textos superfluos.
- Evita escribir «Está correcto»; si algo no requiere mejora, usa la etiqueta (Sin observaciones).
- Mantén viñetas claras y tablas donde se indiquen.
- Usa fechas absolutas ("26 de mayo de 2025") para evitar ambigüedad.
- Todas las sugerencias deben ser concretas y accionables.

Aquí está el sílabo a analizar:
${documentoTexto}`;

      // Segundo análisis: Extracción de temas por sesión
      const promptSesiones = `Analiza el siguiente sílabo y extrae los temas específicos de cada sesión. 
      
Para cada sesión que encuentres, devuelve la información en este formato JSON:
{
  "sesiones": [
    {
      "sesion": "Sesión 1",
      "temas": ["tema1", "tema2", "tema3"]
    },
    {
      "sesion": "Sesión 2", 
      "temas": ["tema1", "tema2"]
    }
  ]
}

Sílabo:
${documentoTexto}`;

      // Hacer las llamadas a DeepSeek API
      const [analisisGeneral, analisisSesiones] = await Promise.all([
        realizarAnalisis(promptRevision, apiKey),
        realizarAnalisis(promptSesiones, apiKey)
      ]);

      // Procesar respuesta de sesiones
      let sesionesData: SesionTema[] = [];
      try {
        const sesionesJson = JSON.parse(analisisSesiones);
        sesionesData = sesionesJson.sesiones || [];
      } catch (error) {
        console.error('Error parsing sesiones:', error);
        toast.error('Error al procesar los temas por sesión');
      }

      // Dividir el análisis general en secciones
      const secciones = analisisGeneral.split('\n\n');
      const resultadoFinal: AnalisisResultado = {
        objetivoGeneral: extraerSeccion(secciones, 'Objetivo general') || '(Sin observaciones)',
        objetivosEspecificos: extraerSeccion(secciones, 'Objetivos específicos') || '(Sin observaciones)',
        contenidos: extraerSeccion(secciones, 'Contenidos') || '(Sin observaciones)',
        softwareRecursos: extraerSeccion(secciones, 'Software y recursos educativos utilizados') || '(Sin observaciones)',
        bibliografia: extraerSeccion(secciones, 'Bibliografía') || '(Sin observaciones)',
        sesiones: sesionesData
      };

      setResultado(resultadoFinal);
      toast.success('Análisis completado exitosamente');

    } catch (error) {
      console.error('Error en análisis:', error);
      toast.error('Error al analizar el sílabo. Verifica tu API Key y conexión.');
    } finally {
      setAnalizando(false);
    }
  };

  const realizarAnalisis = async (prompt: string, apiKey: string): Promise<string> => {
    const response = await fetch('/api/deepseek-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        apiKey
      }),
    });

    if (!response.ok) {
      throw new Error('Error en la API de DeepSeek');
    }

    const data = await response.json();
    return data.result;
  };

  const extraerSeccion = (secciones: string[], nombreSeccion: string): string => {
    const seccion = secciones.find(s => s.toLowerCase().includes(nombreSeccion.toLowerCase()));
    return seccion || '';
  };

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Revisión de Sílabos con IA</h2>
      
      {/* Configuración de API Key */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración DeepSeek API</h3>
        <div className="flex gap-4">
          <input
            type="password"
            placeholder="Ingresa tu API Key de DeepSeek"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
          >
            Obtener API Key
          </a>
        </div>
      </div>

      {/* Selección de curso */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Sílabo</h3>
        <div className="grid gap-4">
          {cursos.map((curso) => (
            <div 
              key={curso.id} 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                cursoSeleccionado?.id === curso.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setCursoSeleccionado(curso)}
            >
              <h4 className="font-medium text-gray-900">{curso.nombre_curso}</h4>
              <p className="text-sm text-gray-600">{curso.archivo_nombre}</p>
              <p className="text-sm text-gray-500">Código: {curso.codigo}</p>
            </div>
          ))}
        </div>

        {cursoSeleccionado && (
          <div className="mt-6">
            <button
              onClick={analizarSilabo}
              disabled={analizando}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {analizando ? 'Analizando...' : 'Analizar Sílabo con IA'}
            </button>
          </div>
        )}
      </div>

      {/* Resultados del análisis */}
      {resultado && (
        <div className="space-y-6">
          {/* Informe de Observaciones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Informe de Observaciones</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Objetivo General</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{resultado.objetivoGeneral}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Objetivos Específicos</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{resultado.objetivosEspecificos}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Contenidos</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{resultado.contenidos}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Software y Recursos Educativos</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{resultado.softwareRecursos}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Bibliografía</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{resultado.bibliografia}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Temas por sesión */}
          {resultado.sesiones.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">📚 Temas por Sesión</h3>
              <div className="grid gap-4">
                {resultado.sesiones.map((sesion, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-800 mb-2">{sesion.sesion}</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {sesion.temas.map((tema, temaIndex) => (
                        <li key={temaIndex} className="text-gray-600 text-sm">{tema}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 