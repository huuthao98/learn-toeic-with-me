import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { B1Controller } from './b1.controller';
import { B1Service } from './b1.service';
import { B1Set, B1SetSchema } from './schemas/b1-set.schema';
import { TestResult, TestResultSchema } from '../dashboard/schemas/test-result.schema';
import { B1Question, B1QuestionSchema } from './schemas/b1-question.schema';
import { UserStreak, UserStreakSchema } from '../dashboard/schemas/user-streak.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: B1Set.name, schema: B1SetSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: B1Question.name, schema: B1QuestionSchema },
      { name: UserStreak.name, schema: UserStreakSchema },
    ]),
    UsersModule,
  ],
  controllers: [B1Controller],
  providers: [B1Service],
  exports: [B1Service],
})
export class B1Module {}
