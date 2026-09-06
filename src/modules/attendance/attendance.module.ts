import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import {
  AttendanceSession,
  AttendanceSessionSchema,
} from './schemas/attendance-session.schema';
import {
  Attendance,
  AttendanceSchema,
} from './schemas/attendance.schema';
import { User, userSchema } from '../users/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: AttendanceSession.name, schema: AttendanceSessionSchema },
      { name: User.name, schema: userSchema}
  ]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService, MongooseModule], // Export MongooseModule so DevicesModule can access records
})
export class AttendanceModule {}