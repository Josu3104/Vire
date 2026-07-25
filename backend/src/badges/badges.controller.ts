import { Controller, Get, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestBadgeDto } from './dto/badge.dto';

@ApiTags('Badges')
@Controller('api/badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my-badges')
  @ApiOperation({ summary: 'Get current user badges' })
  async getMyBadges(@Request() req: any) {
    return this.badgesService.getMyBadges(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('request')
  @ApiOperation({ summary: 'Request a new badge' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('evidence'))
  async requestBadge(
    @Request() req: any,
    @Body() body: RequestBadgeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.badgesService.requestBadge(req.user.id, body, file);
  }

  // Admin Endpoints
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('requests')
  @ApiOperation({ summary: 'Get all pending badge requests (Admin)' })
  async getPendingRequests() {
    return this.badgesService.getPendingRequests();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('requests/:id/approve')
  @ApiOperation({ summary: 'Approve a badge request (Admin)' })
  async approveRequest(@Param('id') id: string, @Request() req: any) {
    return this.badgesService.approveRequest(+id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('requests/:id/deny')
  @ApiOperation({ summary: 'Deny a badge request (Admin)' })
  async denyRequest(
    @Param('id') id: string,
    @Request() req: any,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    return this.badgesService.denyRequest(+id, req.user.id, rejectionReason);
  }
}
