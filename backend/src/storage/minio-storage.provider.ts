import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { StorageProvider } from './storage.provider';

@Injectable()
export class MinIOStorageProvider implements StorageProvider, OnModuleInit {
  private s3Client: S3Client;
  private presignClient: S3Client;
  private bucket: string;
  private publicEndpoint: string;

  constructor(private configService: ConfigService) {
    let endpoint = this.configService.get<string>('S3_ENDPOINT');
    if (!endpoint) {
      const minioHost = this.configService.get<string>('MINIO_HOST');
      const minioPort = this.configService.get<string>('MINIO_PORT') || '9000';
      if (minioHost) {
        endpoint = `http://${minioHost}:${minioPort}`;
      } else {
        endpoint = 'http://localhost:8333';
      }
    }
    
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'vire-storage';
    // For local dev, S3_ENDPOINT is usually 'http://minio:9000', but publicEndpoint should be 'http://localhost:8333'
    // To keep it simple, we check if it includes 'minio'
    this.publicEndpoint = this.configService.get<string>('S3_PUBLIC_ENDPOINT') || (endpoint.includes('minio') ? 'http://localhost:8333' : endpoint);
    
    const credentials = {
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY') || 'admin',
      secretAccessKey: this.configService.get<string>('S3_SECRET_KEY') || 'admin1234',
    };
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials,
      forcePathStyle: true, // Necessary for MinIO and S3-compatible storages
    });

    this.presignClient = new S3Client({
      endpoint: this.publicEndpoint,
      region,
      credentials,
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log(`[Storage] Bucket '${this.bucket}' no encontrado. Creándolo automáticamente...`);
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          const policy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${this.bucket}/*`,
              },
            ],
          });
          await this.s3Client.send(new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: policy }));
          console.log(`[Storage] Bucket '${this.bucket}' creado y configurado como público exitosamente.`);
        } catch (e) {
          console.error(`[Storage] Fallo al crear el bucket o aplicar la política:`, e);
        }
      }
    }
  }

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
      console.error('Error uploading to MinIO:', error);
      throw new InternalServerErrorException('Could not upload file to storage');
    }
  }

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
      const uploadUrl = await getSignedUrl(this.presignClient, command, { expiresIn: 900 });
      const publicUrl = `${this.publicEndpoint}/${this.bucket}/${uniqueFileName}`;

      return { uploadUrl, fileKey: uniqueFileName, publicUrl };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new InternalServerErrorException('Could not generate upload ticket');
    }
  }

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
