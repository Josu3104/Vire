import { Controller, Get, Put, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('top')
  @ApiOperation({ summary: 'Get top engineers (based on upvotes)' })
  @ApiResponse({ status: 200, description: 'Top users returned' })
  async getTopEngineers(@Request() req: any) {
    return this.usersService.getTopEngineers(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('search')
  @ApiOperation({ summary: 'Search for available users to chat with' })
  @ApiResponse({ status: 200, description: 'List of matching users' })
  async searchUsers(@Request() req: any, @Query('q') q: string) {
    if (!q || q.trim().length < 2) return [];
    return this.usersService.searchAvailableUsers(req.user.id, q);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('pending')
  @ApiOperation({ summary: 'Get users pending verification (Admin)' })
  @ApiResponse({ status: 200, description: 'Pending users returned' })
  async getPendingUsers() {
    return this.usersService.getPendingUsers();
  }



  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve user verification (Admin)' })
  @ApiResponse({ status: 200, description: 'User approved' })
  async approveUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.approveUser(+id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject user verification (Admin)' })
  @ApiResponse({ status: 200, description: 'User rejected' })
  async rejectUser(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.usersService.rejectUser(+id, reason, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('request-membership-validation')
  @ApiOperation({ summary: 'Request membership validation' })
  @ApiResponse({ status: 200, description: 'Validation requested' })
  async requestMembershipValidation(@Request() req: any) {
    return this.usersService.requestMembershipValidation(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by id' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }
}
