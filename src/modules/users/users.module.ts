import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {User,userSchema } from './users.schema'
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports:[
    MongooseModule.forFeature([{name:User.name, schema: userSchema }])
  ],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
