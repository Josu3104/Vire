import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('settings')
  @ApiOperation({ summary: 'Get system settings (Admin)' })
  async getSettings() {
    // In a real app we would enforce admin role here
    return this.adminService.getSettings();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('settings')
  @ApiOperation({ summary: 'Update system setting (Admin)' })
  async updateSetting(@Body() body: { key: string; value: string }) {
    // In a real app we would enforce admin role here
    return this.adminService.updateSetting(body.key, body.value);
  }
}
