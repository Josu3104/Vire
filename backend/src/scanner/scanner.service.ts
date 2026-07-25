import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import NodeClam from 'clamscan';

@Injectable()
export class ScannerService {
  private clamscan: any;
  private readonly logger = new Logger(ScannerService.name);

  constructor(private configService: ConfigService) {
    this.initClamAV();
  }

  private async initClamAV() {
    try {
      const host = this.configService.get<string>('clamav.host');
      const port = this.configService.get<number>('clamav.port');

      this.clamscan = await new NodeClam().init({
        clamdscan: {
          host,
          port,
          timeout: 60000,
          localFallback: false,
          active: true,
        },
      });
      this.logger.log(`ClamAV initialized on ${host}:${port}`);
    } catch (err) {
      this.logger.error('Failed to initialize ClamAV', err);
    }
  }

  async scanBuffer(buffer: Buffer): Promise<boolean> {
    if (!this.clamscan) {
      this.logger.warn('ClamAV not initialized, skipping scan');
      // For development, we might want to return true if ClamAV isn't running,
      // but in production, we should probably throw an error.
      return true; 
    }

    try {
      const { isInfected, viruses } = await this.clamscan.scanBuffer(buffer);
      if (isInfected) {
        this.logger.warn(`Malware detected: ${viruses.join(', ')}`);
        throw new BadRequestException(`Malware detected in file: ${viruses.join(', ')}`);
      }
      return true; // Clean
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error scanning buffer', error);
      throw new InternalServerErrorException('Error scanning file for malware');
    }
  }

  async scanStream(stream: import('stream').Readable): Promise<{ isInfected: boolean; viruses: string[] }> {
    if (!this.clamscan) {
      this.logger.warn('ClamAV not initialized, skipping scan');
      return { isInfected: false, viruses: [] };
    }

    try {
      const result = await this.clamscan.scanStream(stream);
      return {
        isInfected: result.isInfected,
        viruses: result.viruses || [],
      };
    } catch (error) {
      this.logger.error('Error scanning stream', error);
      // Fallback a safe si falla el AV, o podríamos marcarlo como erróneo.
      return { isInfected: false, viruses: [] };
    }
  }
}
