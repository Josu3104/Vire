import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ScannerService } from '../scanner/scanner.service';
import { Prisma, BadgeRequestStatus } from '@prisma/client';

@Injectable()
export class BadgesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private scannerService: ScannerService,
  ) {}

  async requestBadge(userId: number, data: any, evidenceFile: Express.Multer.File) {
    if (!evidenceFile) {
      throw new BadRequestException('Evidence file is required');
    }

    await this.scannerService.scanBuffer(evidenceFile.buffer);
    const evidenceUrl = await this.storageService.uploadFile(evidenceFile, 'badges/evidence');

    return this.prisma.badgeRequest.create({
      data: {
        userId,
        badgeName: data.badgeName,
        badgeIcon: data.badgeIcon,
        competition: data.competition,
        evidenceUrl,
        status: BadgeRequestStatus.pending,
      },
    });
  }

  async getMyBadges(userId: number) {
    return this.prisma.badge.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  // Admin Methods
  async getPendingRequests() {
    return this.prisma.badgeRequest.findMany({
      where: { status: BadgeRequestStatus.pending },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async approveRequest(requestId: number, adminId: number) {
    return this.prisma.$transaction(async (prisma) => {
      const request = await prisma.badgeRequest.update({
        where: { id: requestId },
        data: {
          status: BadgeRequestStatus.approved,
          adminReviewerId: adminId,
        },
      });

      const badge = await prisma.badge.create({
        data: {
          userId: request.userId,
          name: request.badgeName,
          icon: request.badgeIcon,
          issuedBy: request.competition, // Assuming competition is the issuer for now
          date: new Date(),
          certified: true,
        },
      });

      return { request, badge };
    });
  }

  async denyRequest(requestId: number, adminId: number, rejectionReason: string) {
    return this.prisma.badgeRequest.update({
      where: { id: requestId },
      data: {
        status: BadgeRequestStatus.denied,
        adminReviewerId: adminId,
        rejectionReason,
      },
    });
  }
}
