import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ScannerService } from '../scanner/scanner.service';
import { Prisma, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private scannerService: ScannerService,
  ) {}

  async generateUploadTicket(fileName: string, mimeType: string, folder: string) {
    return this.storageService.generatePresignedUrl(folder, fileName, mimeType);
  }

  async createProject(
    userId: number,
    data: Prisma.ProjectCreateInput & { type?: string, abstract?: string, doi?: string, year?: number, journal?: string, coauthors?: string },
    coverImageKey?: string,
    pdfKey?: string,
    cadKey?: string,
  ) {
    // Determine public URLs from keys (using SeaweedFS format endpoint/bucket/key)
    const endpoint = process.env.SEAWEED_S3_ENDPOINT || 'http://localhost:8333';
    const bucket = process.env.SEAWEED_S3_BUCKET || 'vire-storage';
    
    const coverImageUrl = coverImageKey ? `${endpoint}/${bucket}/${coverImageKey}` : undefined;
    const pdfLink = pdfKey ? `${endpoint}/${bucket}/${pdfKey}` : undefined;
    const cadLink = cadKey ? `${endpoint}/${bucket}/${cadKey}` : undefined;

    const { type, abstract, doi, year, journal, coauthors, ...projectData } = data;

    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        type: type || 'project',
        abstract,
        doi,
        year,
        journal,
        coauthors,
        coverImageUrl,
        pdfLink,
        cadLink,
        status: ProjectStatus.pendiente, // Pending admin approval
        scanStatus: 'pending',           // Pending async AV scan
        authors: {
          create: {
            userId,
          },
        },
      },
    });

    // Fire and forget asynchronous scanning
    this.scanProjectFilesAsync(project.id, [coverImageKey, pdfKey, cadKey].filter(Boolean) as string[]);

    return project;
  }

  private async scanProjectFilesAsync(projectId: number, fileKeys: string[]) {
    try {
      let isInfected = false;
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

  async findAll(status?: ProjectStatus) {
    return this.prisma.project.findMany({
      where: status ? { status } : { status: ProjectStatus.publico },
      include: {
        authors: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        _count: { select: { votes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        authors: { include: { user: { select: { id: true, name: true, avatarUrl: true, profile: true } } } },
        comments: { include: { user: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' } },
        _count: { select: { votes: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
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
