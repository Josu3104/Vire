import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AvailabilityState, UserRole } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  academicStatus?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  campus?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, enum: AvailabilityState })
  @IsOptional()
  @IsEnum(AvailabilityState)
  availabilityState?: AvailabilityState;

  @ApiProperty({ required: false })
  @IsOptional()
  onboardingComplete?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  isContactPublic?: boolean;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
