import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicEndpoint: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('storage.endpoint') || 'http://localhost:8333';
    this.bucket = this.configService.get<string>('storage.bucket') || 'vire-storage';
    this.publicEndpoint = endpoint;
    
    this.s3Client = new S3Client({
      endpoint,
      region: this.configService.get<string>('storage.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('storage.accessKey') || 'admin',
        secretAccessKey: this.configService.get<string>('storage.secretKey') || 'admin',
      },
      forcePathStyle: true, // Needed for SeaweedFS S3 API
    });
  }

  // Permite subir directamente a memoria (fallback para archivos muy pequeños)
  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: uniqueFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      return `${this.publicEndpoint}/${this.bucket}/${uniqueFileName}`;
    } catch (error) {
      console.error('Error uploading to SeaweedFS:', error);
      throw new InternalServerErrorException('Could not upload file to storage');
    }
  }

  // Genera URL presignada para que el frontend suba directo a S3
  async generatePresignedUrl(folder: string, originalName: string, mimeType: string): Promise<{ uploadUrl: string, fileKey: string, publicUrl: string }> {
    const fileExtension = originalName.split('.').pop();
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: uniqueFileName,
        ContentType: mimeType,
      });

      // La URL expira en 15 minutos
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
      const publicUrl = `${this.publicEndpoint}/${this.bucket}/${uniqueFileName}`;

      return { uploadUrl, fileKey: uniqueFileName, publicUrl };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new InternalServerErrorException('Could not generate upload ticket');
    }
  }

  // Obtiene un stream de lectura para escanear archivos sin cargarlos en memoria RAM
  async getFileStream(fileKey: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });
      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error) {
      console.error('Error getting file stream:', error);
      throw new InternalServerErrorException('Could not read file from storage');
    }
  }

  // Borrar un objeto de SeaweedFS (por ejemplo, si tiene virus)
  async deleteFile(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new InternalServerErrorException('Could not delete file from storage');
    }
  }
}
