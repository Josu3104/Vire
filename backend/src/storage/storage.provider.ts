import { Readable } from 'stream';

export abstract class StorageProvider {
  /**
   * Genera una URL firmada para subidas directas desde el frontend
   */
  abstract generatePresignedUrl(folder: string, originalName: string, mimeType: string): Promise<{ uploadUrl: string, fileKey: string, publicUrl: string }>;
  
  /**
   * Obtiene un stream de lectura del archivo (usado para escanear con antivirus sin colapsar la RAM)
   */
  abstract getFileStream(fileKey: string): Promise<Readable>;
  
  /**
   * Borra un archivo del almacenamiento
   */
  abstract deleteFile(fileKey: string): Promise<void>;
  
  /**
   * Sube un archivo directamente desde el buffer de memoria
   * @deprecated Preferir subidas directas desde el cliente con URLs firmadas
   */
  abstract uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
}
