export interface Curso {
  id?: number;
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
}

export interface CursoConRevision extends Curso {
  revision?: RevisionSilabo;
} 