import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestBadgeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  badgeName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  badgeIcon!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  competition!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  evidenceUrl!: string;
}
