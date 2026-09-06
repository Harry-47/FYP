import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { SessionMode } from '../schemas/attendance-session.schema';

export class StartSessionDto {
  @IsNotEmpty({ message: 'Room ID is required' })
  @IsString()
  roomId: string;

  @IsNotEmpty({ message: 'Subject name is required' })
  @IsString()
  subject: string;

  @IsNotEmpty({ message: 'Program name is required' })
  @IsString()
  program: string;

  @IsNotEmpty({ message: 'Semester is required' })
  @IsInt()
  @Min(1)
  @Max(12)
  semester: number;

  @IsNotEmpty({ message: 'Section is required' })
  @IsString()
  section: string;

  @IsOptional()
  @IsEnum(SessionMode)
  mode?: SessionMode; // 'TIMED' | 'CONTINUOUS'

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  durationMinutes?: number; // Default 10 mins
}