import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { VocabularySet, VocabularySetSchema } from './schemas/vocabulary-set.schema';
import { TestResult, TestResultSchema } from '../dashboard/schemas/test-result.schema';
import { VocabularyQuestion, VocabularyQuestionSchema } from './schemas/vocabulary-question.schema';
import { UserStreak, UserStreakSchema } from '../dashboard/schemas/user-streak.schema';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VocabularySet.name, schema: VocabularySetSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: VocabularyQuestion.name, schema: VocabularyQuestionSchema },
      { name: UserStreak.name, schema: UserStreakSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
