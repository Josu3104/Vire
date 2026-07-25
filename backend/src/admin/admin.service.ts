import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageProvider } from '../storage/storage.provider';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageProvider,
  ) {}

  async getSettings() {
    const settings = await this.prisma.systemSettings.findMany();
    const config = {};
    for (const s of settings) {
      config[s.key] = s.value;
    }
    // Default values if not set
    if (!config['rejected_project_retention_days']) {
      config['rejected_project_retention_days'] = '15';
    }
    return config;
  }

  async updateSetting(key: string, value: string) {
    return this.prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // Cron job to run every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldRejectedProjects() {
    this.logger.log('Starting automated cleanup of old rejected projects...');

    const settings = await this.getSettings();
    const retentionDays = parseInt(settings['rejected_project_retention_days'], 10) || 15;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldProjects = await this.prisma.project.findMany({
      where: {
        status: {
          in: ['denegado', 'requiere_cambios'],
        },
        updatedAt: {
          lt: cutoffDate,
        },
      },
      include: {
        files: true,
      },
    });

    if (oldProjects.length === 0) {
      this.logger.log('No old projects to clean up.');
      return;
    }

    this.logger.log(`Found ${oldProjects.length} old project(s) to delete.`);

    for (const project of oldProjects) {
      // 1. Delete all physical files in MinIO
      if (project.files && project.files.length > 0) {
        for (const file of project.files) {
          try {
            await this.storageService.deleteFile(file.storageKey);
            this.logger.log(`Deleted file from MinIO: ${file.storageKey}`);
          } catch (e) {
            this.logger.error(`Failed to delete file from MinIO: ${file.storageKey}`, e);
          }
        }
      }

      // 2. Delete project from DB (Cascade deletes files, comments, votes, etc)
      await this.prisma.project.delete({
        where: { id: project.id },
      });
      this.logger.log(`Deleted project record from DB: ${project.id}`);
    }

    this.logger.log('Automated cleanup finished successfully.');
  }
}
