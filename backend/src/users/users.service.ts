import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
    const { avatarUrl, role, name, password, ieeeId, cimeqhId, ...profileData } = data;

    return this.prisma.$transaction(async (prisma) => {
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const userUpdateData: any = {};
      if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;
      if (role !== undefined) userUpdateData.role = role;
      if (name !== undefined) userUpdateData.name = name;
      
      if (password) {
        const salt = await bcrypt.genSalt();
        userUpdateData.passwordHash = await bcrypt.hash(password, salt);
      }

      // If user edits affiliation IDs, they go back to pendingVerification 
      // and their role drops to 'comun' to be re-verified
      if (ieeeId !== undefined || cimeqhId !== undefined) {
        if (ieeeId !== undefined) userUpdateData.ieeeId = ieeeId;
        if (cimeqhId !== undefined) userUpdateData.cimeqhId = cimeqhId;
        
        // If they provided at least one ID, they need verification
        const currentIeee = ieeeId !== undefined ? ieeeId : user.ieeeId;
        const currentCimeqh = cimeqhId !== undefined ? cimeqhId : user.cimeqhId;
        
        if (currentIeee || currentCimeqh) {
          userUpdateData.pendingVerification = true;
          userUpdateData.role = 'comun';
        } else {
          userUpdateData.pendingVerification = false;
        }
      }

      if (Object.keys(userUpdateData).length > 0) {
        user = await prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
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

  async requestMembershipValidation(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { pendingVerification: true },
    });
  }

  async approveUser(id: number, adminId?: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.pendingVerification) {
      throw new Error('CONCURRENCY_ERROR: Esta solicitud ya fue revisada por otro administrador.');
    }

    let adminName = 'Un Administrador';
    if (adminId) {
      const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
      adminName = admin?.name || adminName;
    }

    // Determine affiliation based on provided IDs
    let affiliationStr = '';
    if (user.ieeeId && user.cimeqhId) affiliationStr = 'IEEE y CIMEQH';
    else if (user.ieeeId) affiliationStr = 'IEEE';
    else if (user.cimeqhId) affiliationStr = 'CIMEQH';

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: 'member', pendingVerification: false, affiliation: affiliationStr },
    });

    await this.prisma.notification.create({
      data: {
        userId: id,
        type: 'membership_approved',
        message: `El administrador ${adminName} ha aprobado tu solicitud de validación de membresía (${affiliationStr}).`,
      }
    });
    return updatedUser;
  }

  async rejectUser(id: number, reason: string, adminId?: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.pendingVerification) {
      throw new Error('CONCURRENCY_ERROR: Esta solicitud ya fue revisada por otro administrador.');
    }

    let adminName = 'Un Administrador';
    if (adminId) {
      const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
      adminName = admin?.name || adminName;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { pendingVerification: false },
    });

    await this.prisma.notification.create({
      data: {
        userId: id,
        type: 'membership_rejected',
        message: `El administrador ${adminName} rechazó tu solicitud de validación de membresía. Motivo: ${reason}`,
      }
    });
    return updatedUser;
  }

  async getTopEngineers(currentUserId: number) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
      },
      include: {
        profile: true,
        projectAuthors: {
          include: {
            project: {
              select: { upvotes: true }
            }
          }
        }
      }
    });

    const usersWithUpvotes = users.map(user => {
      const totalUpvotes = user.projectAuthors.reduce((sum, pa) => sum + (pa.project?.upvotes || 0), 0);
      return { ...user, totalUpvotes };
    });

    return usersWithUpvotes
      .sort((a, b) => b.totalUpvotes - a.totalUpvotes)
      .slice(0, 3)
      .map(({ projectAuthors, totalUpvotes, ...user }) => user);
  }

  async searchAvailableUsers(currentUserId: number, query: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
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
