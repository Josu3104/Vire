import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.jobListing.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
