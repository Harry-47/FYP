// seed-super-admin.ts
import * as dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../modules/users/users.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // bypassing the UsersService to directly access the User model for seeding
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  const adminEmail = 'huraira38403@gmail.com';
  const existing = await userModel.findOne({ email: adminEmail });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('op92Ay6#', 12);
    await userModel.create({
      email: adminEmail,
      username: 'superadmin',
      password: hashedPassword,
      role: 'super-admin',
      // You can add other required fields here if necessary, e.g., rollNo, deviceUUID, department, program, session, semester, section, etc. but as their is required function used in the schema, it will check on runtime weather the document being created has role as studnent, if not then it those fiedsl will become optional and will not be checked for validation. So, we can skip them here.
    });
    console.log('Super-Admin seeded successfully!');
  } else {
    console.log('Super-Admin already exists.');
  }

  await app.close();
}

bootstrap();