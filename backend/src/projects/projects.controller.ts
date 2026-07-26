import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Delete, Patch, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectStatus } from '@prisma/client';
import { CreateProjectDto, PresignProjectDto, VoteProjectDto, CommentProjectDto } from './dto/project.dto';

@ApiTags('Projects')
@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('presign')
  @ApiOperation({ summary: 'Generate S3 presigned URL for direct upload' })
  async getPresignedUrl(@Body() body: PresignProjectDto) {
    return this.projectsService.generateUploadTicket(body.fileName, body.mimeType, body.folder);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @Request() req: any,
    @Body() body: CreateProjectDto,
  ) {
    const userId = req.user.id;
    
    // Parse tags and advisors since they might come as JSON strings or arrays
    const tags = typeof body.tags === 'string' ? JSON.parse(body.tags) : (body.tags || []);
    const advisors = typeof body.advisors === 'string' ? JSON.parse(body.advisors) : (body.advisors || []);

    const projectData = {
      title: body.title,
      university: body.university,
      branch: body.branch,
      description: body.description,
      type: body.type,
      abstract: body.abstract,
      doi: body.doi,
      year: body.year,
      journal: body.journal,
      coauthors: body.coauthors,
      tags,
      advisors,
      academicLevel: body.academicLevel || 'universitario',
      files: body.files,
    };

    return this.projectsService.createProject(
      userId, 
      projectData as any
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all public projects (Admin can filter by status)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status or "all"' })
  async findAll(@Query('status') status?: ProjectStatus | 'all') {
    // Note: In a real app we'd check if the user is an admin before allowing non-public status queries.
    // For this prototype, we'll allow it if passed, but default to public.
    return this.projectsService.findAll(status);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get all projects authored by current user' })
  async findMyProjects(@Request() req: any) {
    return this.projectsService.findUserProjects(req.user.id);
  }

  @Get('trending-tags')
  @ApiOperation({ summary: 'Get trending tags from public projects' })
  async getTrendingTags() {
    return this.projectsService.getTrendingTags();
  }

  @Get('filters')
  @ApiOperation({ summary: 'Get available filters from public projects' })
  async getFilters() {
    return this.projectsService.getFilters();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update project status (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: ProjectStatus,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    // In a real app we would check req.user.role === 'admin' here
    return this.projectsService.updateStatus(+id, status, req.user.id, rejectionReason);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update a project (Author only)' })
  async updateProject(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any
  ) {
    return this.projectsService.updateProject(+id, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/vote')
  @ApiOperation({ summary: 'Upvote or downvote a project' })
  async vote(@Param('id') id: string, @Request() req: any, @Body() body: VoteProjectDto) {
    return this.projectsService.vote(+id, req.user.id, body.isUpvote);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a project' })
  async addComment(@Param('id') id: string, @Request() req: any, @Body() body: CommentProjectDto) {
    return this.projectsService.addComment(+id, req.user.id, body.text);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.deleteProject(+id, req.user.id);
  }
}
