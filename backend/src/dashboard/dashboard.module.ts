import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TestResult, TestResultSchema } from './schemas/test-result.schema';
import { UserStreak, UserStreakSchema } from './schemas/user-streak.schema';
import { StudyPlan, StudyPlanSchema } from './schemas/study-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestResult.name, schema: TestResultSchema },
      { name: UserStreak.name, schema: UserStreakSchema },
      { name: StudyPlan.name, schema: StudyPlanSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
