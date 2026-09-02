import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from './tenant.schema';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: false, // used only within auth module boundary
      secret: 'MY_SUPER_SECRET_KEY_123', // .env se lena better hai
      signOptions: { expiresIn: '15m' }, // Default expiry (Access token)
    }),

    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
    EmailModule
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
