import { Controller, Get } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Jobs')
@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'List all jobs' })
  findAll() {
    return this.jobsService.findAll();
  }
}
