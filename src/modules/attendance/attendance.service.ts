import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AttendanceSession,
  AttendanceSessionDocument,
  SessionMode,
  SessionStatus,
} from './schemas/attendance-session.schema';
import {
  Attendance,
  AttendanceDocument,
} from './schemas/attendance.schema';
import { User, UserDocument } from '../users/users.schema';
import { StartSessionDto } from './DTO/start-session.dto';
import { ManualOverrideDto } from './DTO/manual-override.dto';
import { ExtendSessionDto } from './DTO/extend-session.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(AttendanceSession.name)
    private readonly sessionModel: Model<AttendanceSessionDocument>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // 1. Supervisor starts an on-demand attendance window
  async startSession(
    teacher: { sub: string; tenantId: string; university: string },
    dto: StartSessionDto,
  ) {
    const cleanRoom = dto.roomId.toUpperCase().trim();

    const activeExisting = await this.sessionModel.findOne({
      roomId: cleanRoom,
      status: SessionStatus.ACTIVE,
      expiresAt: { $gt: new Date() },
    });

    if (activeExisting) {
      throw new ConflictException(
        `Room ${cleanRoom} already has an ongoing active attendance session for subject ${activeExisting.subjectCode}`,
      );
    }

    const duration = dto.durationMinutes || 10;
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + duration * 60 * 1000);

    const session = await this.sessionModel.create({
      tenantId: new Types.ObjectId(teacher.tenantId),
      university: teacher.university,
      teacherId: new Types.ObjectId(teacher.sub),
      subjectCode: dto.subject.toUpperCase().trim(),
      roomId: cleanRoom,
      program: dto.program.toUpperCase().trim(),
      semester: dto.semester,
      section: dto.section.toUpperCase().trim(),
      mode: dto.mode || SessionMode.TIMED,
      status: SessionStatus.ACTIVE,
      startsAt,
      expiresAt,
      presentCount: 0,
    });

    return {
      success: true,
      message: `Attendance session opened for ${session.subjectCode} in room ${session.roomId}`,
      data: session,
    };
  }

  // 2. Extend active session by X minutes
  async extendSession(sessionId: string, dto: ExtendSessionDto) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || session.status !== SessionStatus.ACTIVE) {
      throw new NotFoundException('Active session not found');
    }

    const currentExpiry = new Date(session.expiresAt).getTime();
    session.expiresAt = new Date(currentExpiry + dto.extendByMinutes * 60 * 1000);
    await session.save();

    return {
      success: true,
      message: `Session extended by ${dto.extendByMinutes} minutes`,
      expiresAt: session.expiresAt,
    };
  }

  // 3. Manually close attendance window
  async endSession(sessionId: string) {
    const session = await this.sessionModel.findByIdAndUpdate(
      sessionId,
      { status: SessionStatus.COMPLETED, expiresAt: new Date() },
      { new: true },
    );

    if (!session) throw new NotFoundException('Session not found');

    return {
      success: true,
      message: 'Attendance session ended successfully',
      data: session,
    };
  }

  // 4. Void / Cancel Session (Rollback attendance)
  async voidSession(sessionId: string) {
    const session = await this.sessionModel.findByIdAndUpdate(
      sessionId,
      { status: SessionStatus.CANCELLED },
      { new: true },
    );

    if (!session) throw new NotFoundException('Session not found');

    return {
      success: true,
      message: 'Session voided. Scans will be excluded from final attendance calculation.',
    };
  }

  // 5. Manual Override / Manual Attendance by Supervisor (Crash-Proof)
  async manualOverride(dto: ManualOverrideDto) {
    const session = await this.sessionModel.findById(dto.sessionId);
    if (!session) throw new NotFoundException('Session not found');

    const student = await this.userModel.findById(dto.studentId);
    if (!student) throw new NotFoundException('Student not found');

    const updated = await this.attendanceModel.findOneAndUpdate(
      {
        sessionId: new Types.ObjectId(dto.sessionId),
        studentId: new Types.ObjectId(dto.studentId),
      },
      {
        $set: {
          status: dto.status,
          isManualOverride: true,
        },
        $setOnInsert: {
          rollNo: student.rollNo || 'N/A',
          tenantId: session.tenantId,
          university: session.university,
          roomId: session.roomId,
          scannedAt: new Date(),
          isSus: false,
        },
      },
      { upsert: true, new: true },
    );

    return {
      success: true,
      message: `Student marked as ${dto.status}`,
      data: updated,
    };
  }

  // 6. Live Session Feed
  async getLiveSessionData(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).lean();
    if (!session) throw new NotFoundException('Session not found');

    const records = await this.attendanceModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .populate('studentId', 'username email rollNo deviceUUID')
      .sort({ scannedAt: -1 })
      .lean();

    return {
      success: true,
      session,
      totalCount: records.length,
      records,
    };
  }

  // 7. Student Attendance Analytics (Matching schema fields)
  async getStudentAnalytics(studentId: string) {
    const records = await this.attendanceModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('sessionId', 'subjectCode startsAt status roomId')
      .sort({ scannedAt: -1 })
      .lean();

    const validRecords = records.filter(
      (r: any) => r.sessionId && r.sessionId.status !== SessionStatus.CANCELLED,
    );

    return {
      success: true,
      totalAttended: validRecords.length,
      history: validRecords,
    };
  }
}