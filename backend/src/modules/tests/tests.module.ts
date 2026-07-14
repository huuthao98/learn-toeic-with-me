import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { TestSet, TestSetSchema } from './schemas/test-set.schema';
import { TestResult, TestResultSchema } from '../dashboard/schemas/test-result.schema';
import { Question, QuestionSchema } from '../questions/schemas/question.schema';
import { UserStreak, UserStreakSchema } from '../dashboard/schemas/user-streak.schema';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestSet.name, schema: TestSetSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: UserStreak.name, schema: UserStreakSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
