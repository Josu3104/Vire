import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { storageConfig } from './config/storage.config';
import { clamavConfig } from './config/clamav.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { ScannerModule } from './scanner/scanner.module';
import { ProjectsModule } from './projects/projects.module';
import { BadgesModule } from './badges/badges.module';
import { ChatModule } from './chat/chat.module';
import { EmailsModule } from './emails/emails.module';
import { JobsModule } from './jobs/jobs.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, storageConfig, clamavConfig],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StorageModule,
    ScannerModule,
    ProjectsModule,
    BadgesModule,
    ChatModule,
    EmailsModule,
    JobsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
