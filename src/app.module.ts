import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles/roles.guard';
import { DevicesModule } from './modules/devices/devices.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AttendaceService } from './modules/attendace/attendace.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env'}),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        return {
          uri,
        };
      },
    }),
    UsersModule,
    AuthModule,
    EmailModule,
    DevicesModule,
    AttendanceModule,
  ],
  providers: [
    {
      //First, the jwt authentication guard will run
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
      //Then, the roles gurad will run becuase jwt token contains the role of the user and roles guard will check if the user has the required role to access the route
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
      AttendaceService,
  ]
})
export class AppModule {}
