import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ToeicController } from './toeic.controller';
import { ToeicService } from './toeic.service';
import { ToeicSet, ToeicSetSchema } from './schemas/toeic-set.schema';
import { TestResult, TestResultSchema } from '../dashboard/schemas/test-result.schema';
import { ToeicQuestion, ToeicQuestionSchema } from './schemas/toeic-question.schema';
import { UserStreak, UserStreakSchema } from '../dashboard/schemas/user-streak.schema';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ToeicSet.name, schema: ToeicSetSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: ToeicQuestion.name, schema: ToeicQuestionSchema },
      { name: UserStreak.name, schema: UserStreakSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ToeicController],
  providers: [ToeicService],
  exports: [ToeicService],
})
export class ToeicModule {}
