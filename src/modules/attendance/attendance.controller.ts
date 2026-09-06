import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Roles } from '../../decorators/roles/roles.decorator';
import { StartSessionDto } from './DTO/start-session.dto';
import { ExtendSessionDto } from './DTO/extend-session.dto';
import { ManualOverrideDto } from './DTO/manual-override.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // 1. Teacher starts lecture attendance session
  @Roles('teacher', 'admin')
  @Post('session/start')
  @HttpCode(HttpStatus.CREATED)
  async startSession(@Req() req: any, @Body() dto: StartSessionDto) {
    return this.attendanceService.startSession(req.user, dto);
  }

  // 2. Extend active session timer (+2 mins / +5 mins)
  @Roles('teacher', 'admin')
  @Post('session/:id/extend')
  @HttpCode(HttpStatus.OK)
  async extendSession(
    @Param('id') id: string,
    @Body() dto: ExtendSessionDto,
  ) {
    return this.attendanceService.extendSession(id, dto);
  }

  // 3. Close session manually
  @Roles('teacher', 'admin')
  @Post('session/:id/end')
  @HttpCode(HttpStatus.OK)
  async endSession(@Param('id') id: string) {
    return this.attendanceService.endSession(id);
  }

  // 4. Void / Cancel session on class dismissal
  @Roles('teacher', 'admin')
  @Post('session/:id/void')
  @HttpCode(HttpStatus.OK)
  async voidSession(@Param('id') id: string) {
    return this.attendanceService.voidSession(id);
  }

  // 5. Live counter & attendees list for teacher projector / dashboard
  @Roles('teacher', 'admin')
  @Get('session/:id/live')
  async getLiveSessionData(@Param('id') id: string) {
    return this.attendanceService.getLiveSessionData(id);
  }

  // 6. Manual override by teacher (Phone dead / medical issue)
  @Roles('teacher', 'admin')
  @Patch('manual-override')
  @HttpCode(HttpStatus.OK)
  async manualOverride(@Req() req: any, @Body() dto: ManualOverrideDto) {
    return this.attendanceService.manualOverride(dto);
  }

  // 7. Student attendance history & analytics
  @Roles('student', 'teacher', 'admin')
  @Get('student/:studentId')
  async getStudentAnalytics(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentAnalytics(studentId);
  }
}