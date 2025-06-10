export interface Curso {
  id?: string;
  nombre_curso: string;
  version: number;
  fecha_entrega: string;
  archivo_url: string;
  archivo_nombre: string;
  cuenta: 'ejecutiva' | 'pregrado' | 'Harson' | 'escuela';
  codigo: string;
  created_at?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export interface RevisionSilabo {
  id?: string;
  curso_id: string;
  fecha_revision: string;
  estado: 'aprobado' | 'desaprobado';
  informe_revision: string;
  revisor?: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SesionTema {
  sesion: string;
  temas: string[];
}

export interface AnalisisResultado {
  objetivoGeneral: string;
  objetivosEspecificos: string;
  contenidos: string;
  softwareRecursos: string;
  bibliografia: string;
  sesiones: SesionTema[];
  // Nuevos campos para los productos solicitados
  informeCompleto?: string;
  jsonSesiones?: Record<string, unknown>;
}

export interface InvestigacionSesion {
  id?: string;
  curso_id: string;
  numero_sesion: number;
  tema_sesion: string;
  contenido_investigacion: string;
  estado: 'pendiente' | 'procesando' | 'completada' | 'error';
  fecha_investigacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface ComparacionSesion {
  id?: string;
  curso_id: string;
  numero_sesion: number;
  investigacion_id: string;
  documento1_url?: string;
  documento1_nombre?: string;
  documento2_url?: string;
  documento2_nombre?: string;
  resultado_comparacion?: string;
  estado: 'pendiente' | 'procesando' | 'completada' | 'error';
  fecha_comparacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActividadSesion {
  id?: string;
  curso_id: string;
  numero_sesion: number;
  texto_actividad_original?: string;
  propuesta_actividad?: string;
  estado: 'pendiente' | 'procesando' | 'completada' | 'error';
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface CursoConRevision extends Curso {
  revision?: RevisionSilabo;
} 