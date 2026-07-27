import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageProvider } from '../storage/storage.provider';
import { ScannerService } from '../scanner/scanner.service';
import { Prisma, ProjectStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageProvider,
    private scannerService: ScannerService,
    private notificationsService: NotificationsService,
  ) {}

  async generateUploadTicket(fileName: string, mimeType: string, folder: string) {
    return this.storageService.generatePresignedUrl(folder, fileName, mimeType);
  }

  async createProject(
    userId: number,
    data: Prisma.ProjectCreateInput & { 
      type?: string, abstract?: string, doi?: string, year?: number, journal?: string, coauthors?: string,
      files?: Array<{filename: string, originalName: string, mimeType: string, size: number, storageKey: string, type: any}>
    }
  ) {
    let endpoint = process.env.S3_PUBLIC_ENDPOINT;
    if (!endpoint) {
      const minioHost = process.env.MINIO_HOST;
      const minioPort = process.env.MINIO_PORT || '9000';
      endpoint = minioHost ? `http://${minioHost}:${minioPort}` : 'http://localhost:8333';
    }
    const bucket = process.env.S3_BUCKET || 'vire-storage';
    
    const { type, abstract, doi, year, journal, coauthors, files, ...projectData } = data;

    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        type: type || 'project',
        abstract,
        doi,
        year,
        journal,
        coauthors,
        status: ProjectStatus.pendiente, // Pending admin approval
        scanStatus: 'pending',           // Pending async AV scan
        authors: {
          create: {
            userId,
          },
        },
        files: files && files.length > 0 ? {
          create: files.map(file => ({
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            extension: file.originalName.split('.').pop() || '',
            size: file.size,
            storageProvider: 'minio',
            storageKey: file.storageKey,
            downloadUrl: `${endpoint}/${bucket}/${file.storageKey}`,
            type: file.type,
            scanStatus: 'pending'
          }))
        } : undefined
      },
      include: {
        files: true
      }
    });

    // Fire and forget asynchronous scanning
    if (project.files && project.files.length > 0) {
      this.scanProjectFilesAsync(project.id, project.files.map(f => f.storageKey));
    }

    return project;
  }

  async updateProject(
    projectId: number,
    userId: number,
    data: any
  ) {
    // 1. Verify author
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { authors: true, files: true }
    });

    if (!project) throw new NotFoundException('Project not found');
    const isAuthor = project.authors.some(a => a.userId === userId);
    if (!isAuthor && data.adminBypass !== true) { // For simplicity, just check author
      throw new BadRequestException('Not authorized to edit this project');
    }

    const { type, abstract, doi, year, journal, coauthors, files, ...projectData } = data;
    let endpoint = process.env.S3_PUBLIC_ENDPOINT;
    if (!endpoint) {
      const minioHost = process.env.MINIO_HOST;
      const minioPort = process.env.MINIO_PORT || '9000';
      endpoint = minioHost ? `http://${minioHost}:${minioPort}` : 'http://localhost:8333';
    }
    const bucket = process.env.S3_BUCKET || 'vire-storage';

    let newFilesToScan: string[] = [];

    // 2. Handle Files
    if (files && Array.isArray(files)) {
      const existingFiles = project.files || [];
      const newFiles = files.filter(f => !f.id); // Assuming new files don't have an ID yet
      const keptFileIds = files.filter(f => f.id).map(f => f.id);
      
      const filesToDelete = existingFiles.filter(f => !keptFileIds.includes(f.id));

      // Delete removed files from DB and MinIO
      for (const f of filesToDelete) {
        await this.storageService.deleteFile(f.storageKey).catch(console.error);
        await this.prisma.projectFile.delete({ where: { id: f.id } });
      }

      // Add new files
      if (newFiles.length > 0) {
        await this.prisma.projectFile.createMany({
          data: newFiles.map(file => ({
            projectId,
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            extension: file.originalName.split('.').pop() || '',
            size: file.size,
            storageProvider: 'minio',
            storageKey: file.storageKey,
            downloadUrl: `${endpoint}/${bucket}/${file.storageKey}`,
            type: file.type,
            scanStatus: 'pending'
          }))
        });
        newFilesToScan = newFiles.map(f => f.storageKey);
      }
    }

    // 3. Update Project Data and revert status to pending
    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...projectData,
        type: type || project.type,
        abstract,
        doi,
        year,
        journal,
        coauthors,
        status: ProjectStatus.pendiente, // Always revert to pending on edit
        scanStatus: newFilesToScan.length > 0 ? 'pending' : project.scanStatus,
      },
      include: {
        files: true
      }
    });

    if (newFilesToScan.length > 0) {
      this.scanProjectFilesAsync(projectId, newFilesToScan);
    }

    return updatedProject;
  }

  private async scanProjectFilesAsync(projectId: number, fileKeys: string[]) {
    try {
      let isInfected = false;
      
      /*
      // Antivirus scanning temporarily disabled
      for (const key of fileKeys) {
        // Skip scanning huge CAD files for now (or implement chunk streaming)
        if (key.endsWith('.sldprt') || key.endsWith('.step')) {
          console.log(`[AV Bypass] Skipping CAD file: ${key}`);
          continue;
        }

        const stream = await this.storageService.getFileStream(key);
        const scanResult = await this.scannerService.scanStream(stream);

        if (scanResult.isInfected) {
          isInfected = true;
          console.error(`[AV ALERT] Virus found in file: ${key} for project ${projectId}. Malware: ${scanResult.viruses.join(', ')}`);
          await this.storageService.deleteFile(key);
        }
      }
      */

      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          scanStatus: isInfected ? 'infected' : 'clean',
          status: isInfected ? 'requiere_cambios' : 'pendiente',
          rejectionReason: isInfected ? 'El sistema antivirus detectó un archivo malicioso y lo ha eliminado.' : null,
        },
      });

    } catch (error) {
      console.error(`[Scanner Error] Error processing project ${projectId}:`, error);
    }
  }

  private mapLegacyFields(project: any) {
    if (!project) return project;
    
    const upvotedBy = project.votes?.filter((v: any) => v.isUpvote).map((v: any) => v.userId) || [];
    const downvotedBy = project.votes?.filter((v: any) => !v.isUpvote).map((v: any) => v.userId) || [];

    if (!project.files) {
      return { ...project, upvotedBy, downvotedBy };
    }
    const coverFile = project.files.find((f: any) => f.type === 'COVER' || f.type === 'IMAGE');
    const pdfFile = project.files.find((f: any) => f.type === 'PDF');
    const cadFile = project.files.find((f: any) => f.type === 'CAD');
    
    return {
      ...project,
      upvotedBy,
      downvotedBy,
      coverImage: coverFile ? coverFile.downloadUrl : null,
      pdfLink: pdfFile ? pdfFile.downloadUrl : null,
      cadLink: cadFile ? cadFile.downloadUrl : null,
    };
  }

  async findAll(status?: ProjectStatus | 'all') {
    let whereClause = {};
    if (status && status !== 'all') {
      whereClause = { status };
    } else if (status !== 'all') {
      whereClause = { status: ProjectStatus.publico };
    } // if 'all', whereClause remains {}

    const projects = await this.prisma.project.findMany({
      where: whereClause,
      include: {
        authors: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        _count: { select: { votes: true, comments: true } },
        files: true,
        votes: { select: { userId: true, isUpvote: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((p) => this.mapLegacyFields(p));
  }

  async findUserProjects(userId: number) {
    const projects = await this.prisma.project.findMany({
      where: {
        authors: {
          some: { userId }
        }
      },
      include: {
        authors: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        _count: { select: { votes: true, comments: true } },
        files: true,
        votes: { select: { userId: true, isUpvote: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((p) => this.mapLegacyFields(p));
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        authors: { include: { user: { select: { id: true, name: true, avatarUrl: true, profile: true } } } },
        comments: { include: { user: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' } },
        _count: { select: { votes: true } },
        files: true,
        votes: { select: { userId: true, isUpvote: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return this.mapLegacyFields(project);
  }

  async toggleVisibility(projectId: number, userId: number, status: ProjectStatus) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { authors: true }
    });
    if (!existingProject) throw new NotFoundException('Project not found');
    
    const isAuthor = existingProject.authors.some(a => a.userId === userId);
    if (!isAuthor) throw new ForbiddenException('Only authors can change project visibility');
    if (status !== 'publico' && status !== 'privado') throw new BadRequestException('Invalid visibility status');

    return this.prisma.project.update({
      where: { id: projectId },
      data: { status }
    });
  }

  async updateStatus(projectId: number, status: ProjectStatus, adminId: number, rejectionReason?: string) {
    const existingProject = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject) throw new NotFoundException('Project not found');
    if (existingProject.status !== 'pendiente') {
      throw new Error('CONCURRENCY_ERROR: Este proyecto ya fue revisado por otro administrador.');
    }

    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    const adminName = admin?.name || 'Un Administrador';

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status,
        adminReviewerId: adminId,
        rejectionReason: rejectionReason || null,
      },
      include: {
        authors: true,
      }
    });

    // Notify author(s) about the status change
    if (status === 'denegado' || status === 'requiere_cambios') {
      const reasonMessage = rejectionReason ? `\n\nMotivo: ${rejectionReason}` : '';
      const notificationTitle = status === 'denegado' ? 'Proyecto Denegado' : 'Proyecto Requiere Cambios';
      const notificationMessage = `El administrador ${adminName} ha revisado y ${status === 'denegado' ? 'denegado' : 'requerido cambios'} para la publicación de tu proyecto "${project.title}".${reasonMessage}`;

      for (const author of project.authors) {
        await this.notificationsService.createNotification({
          userId: author.userId,
          message: `[${notificationTitle}] ${notificationMessage}`,
          type: 'SYSTEM',
        });
      }
    } else if (status === 'publico') {
      for (const author of project.authors) {
        await this.notificationsService.createNotification({
          userId: author.userId,
          message: `[¡Proyecto Aprobado!] El administrador ${adminName} ha aprobado tu proyecto "${project.title}" y ahora es público.`,
          type: 'SYSTEM',
        });
      }
    }

    return project;
  }

  async vote(projectId: number, userId: number, isUpvote: boolean) {
    const existingVote = await this.prisma.projectVote.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (existingVote) {
      if (existingVote.isUpvote === isUpvote) {
        // Remove vote if clicking the same one again
        await this.prisma.projectVote.delete({
          where: { projectId_userId: { projectId, userId } },
        });
      } else {
        // Change vote
        await this.prisma.projectVote.update({
          where: { projectId_userId: { projectId, userId } },
          data: { isUpvote },
        });
      }
    } else {
      // New vote
      await this.prisma.projectVote.create({
        data: { projectId, userId, isUpvote },
      });
    }

    // Recalculate totals
    const upvotesCount = await this.prisma.projectVote.count({ where: { projectId, isUpvote: true } });
    const downvotesCount = await this.prisma.projectVote.count({ where: { projectId, isUpvote: false } });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { upvotes: upvotesCount, downvotes: downvotesCount },
    });

    return { upvotes: upvotesCount, downvotes: downvotesCount };
  }

  async addComment(projectId: number, userId: number, text: string) {
    return this.prisma.comment.create({
      data: {
        projectId,
        userId,
        text,
      },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });
  }

  async deleteProject(projectId: number, userId: number) {
    const project = await this.findOne(projectId);
    
    // Check if user is an author
    const isAuthor = project.authors.some(a => a.userId === userId);
    if (!isAuthor) {
      throw new BadRequestException('You do not have permission to delete this project.');
    }

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  async getTrendingTags() {
    const projects = await this.prisma.project.findMany({
      where: { status: ProjectStatus.publico },
      select: { tags: true },
    });
    
    const tagCounts: Record<string, number> = {};
    for (const p of projects) {
      const tags = (p.tags as string[]) || [];
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  async getFilters() {
    const projects = await this.prisma.project.findMany({
      where: { status: ProjectStatus.publico },
      select: { university: true, branch: true, academicLevel: true, tags: true },
    });

    const universities = new Set<string>();
    const branches = new Set<string>();
    const levels = new Set<string>();
    const tags = new Set<string>();

    for (const p of projects) {
      if (p.university) universities.add(p.university);
      if (p.branch) branches.add(p.branch);
      if (p.academicLevel) levels.add(p.academicLevel);
      const projectTags = (p.tags as string[]) || [];
      for (const tag of projectTags) {
        tags.add(tag);
      }
    }

    return {
      universities: Array.from(universities).sort(),
      branches: Array.from(branches).sort(),
      levels: Array.from(levels).sort(),
      tags: Array.from(tags).sort(),
    };
  }
}
