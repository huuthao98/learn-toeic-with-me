import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { InterviewTopic, InterviewTopicSchema } from './schemas/interview-topic.schema';
import { TestResult, TestResultSchema } from '../dashboard/schemas/test-result.schema';
import { InterviewQuestion, InterviewQuestionSchema } from './schemas/interview-question.schema';
import { UserStreak, UserStreakSchema } from '../dashboard/schemas/user-streak.schema';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InterviewTopic.name, schema: InterviewTopicSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: InterviewQuestion.name, schema: InterviewQuestionSchema },
      { name: UserStreak.name, schema: UserStreakSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService],
})
export class InterviewModule {}
