import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { AttendanceStatus } from '../schemas/attendance.schema';

export class ManualOverrideDto {
  @IsNotEmpty()
  @IsMongoId()
  sessionId: string;

  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus; // PRESENT | ABSENT | LEAVE
}