import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  university!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  branch!: string;

  @ApiProperty({ required: false, enum: ['project', 'paper'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  abstract?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  doi?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  year?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  journal?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coauthors?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: any[];

  @ApiProperty({ required: false, enum: ['tecnico_escolar', 'universitario', 'profesional'] })
  @IsOptional()
  @IsString()
  academicLevel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  advisors?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  files?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    storageKey: string;
    type: string;
  }>;
}

export class PresignProjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  folder!: string;
}

export class CommentProjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class VoteProjectDto {
  @ApiProperty()
  @IsBoolean()
  isUpvote!: boolean;
}
