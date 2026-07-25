import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateProfile(userId: number, data: any): Promise<any> {
    const { avatarUrl, role, ...profileData } = data;

    return this.prisma.$transaction(async (prisma) => {
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      if (avatarUrl !== undefined || role !== undefined) {
        user = await prisma.user.update({
          where: { id: userId },
          data: { 
            ...(avatarUrl !== undefined && { avatarUrl }),
            ...(role !== undefined && { role }),
          },
        });
      }

      if (profileData.birthdate) {
        profileData.birthdate = new Date(profileData.birthdate);
      }

      const profile = await prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          ...profileData,
        },
        update: {
          ...profileData,
        },
      });

      return { ...user, profile };
    });
  }

  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: { pendingVerification: true },
      include: { profile: true },
    });
  }

  async approveUser(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { 
        pendingVerification: false,
        role: 'member',
      },
    });
  }

  async getTopEngineers() {
    return this.prisma.user.findMany({
      take: 3,
      orderBy: { badges: { _count: 'desc' } },
      include: { profile: true },
    });
  }

  async searchAvailableUsers(currentUserId: number, query: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        profile: {
          availabilityState: { not: 'unavailable' },
        },
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        affiliation: true,
        profile: {
          select: { university: true, academicStatus: true }
        }
      }
    });
  }
}
