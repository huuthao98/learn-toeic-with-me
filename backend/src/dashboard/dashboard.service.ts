import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestResult, TestResultDocument } from './schemas/test-result.schema';
import { UserStreak, UserStreakDocument } from './schemas/user-streak.schema';
import { StudyPlan, StudyPlanDocument } from './schemas/study-plan.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(TestResult.name) private testResultModel: Model<TestResultDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
    @InjectModel(StudyPlan.name) private studyPlanModel: Model<StudyPlanDocument>,
  ) {}

  async getStats(userId: string) {
    const latest = await this.testResultModel
      .findOne({ user_id: userId })
      .select('score listening_score reading_score createdAt')
      .sort({ createdAt: -1 })
      .exec();

    const streak = await this.userStreakModel
      .findOne({ user_id: userId })
      .select('current_streak longest_streak last_study_date')
      .exec();

    return {
      estimatedScore: latest?.score || 0,
      listeningScore: latest?.listening_score || 0,
      readingScore: latest?.reading_score || 0,
      targetScore: 850,
      streak: streak?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
    };
  }

  async getTodayPlan(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.studyPlanModel
      .find({ user_id: userId, plan_date: today })
      .exec();
    return data || [];
  }

  async getScoreProgression(userId: string) {
    const data = await this.testResultModel
      .find({ user_id: userId })
      .select('score createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return data.reverse().map((r: any) => ({
      date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: r.score,
    }));
  }

  async getRecentTests(userId: string) {
    const data = await this.testResultModel
      .find({ user_id: userId })
      .select('score listening_score reading_score duration_minutes createdAt status test_set_id')
      .populate('test_set_id', 'name total_questions parts_count')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    return data.map((item: any) => {
      const doc = item.toObject();
      if (doc.test_set_id) {
        doc.test_sets = doc.test_set_id;
        delete doc.test_set_id;
      }
      return doc;
    });
  }
}
