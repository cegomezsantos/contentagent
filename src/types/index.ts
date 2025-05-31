export interface Curso {
  id: string;
  nombre_curso: string;
  version: string;
  fecha_entrega: string;
  archivo_url: string;
  archivo_nombre: string;
  created_at: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
} 