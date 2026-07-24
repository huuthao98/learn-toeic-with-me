import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestResult, TestResultDocument } from './schemas/test-result.schema';
import { UserStreak, UserStreakDocument } from './schemas/user-streak.schema';
import { StudyPlan, StudyPlanDocument } from './schemas/study-plan.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(TestResult.name)
    private testResultModel: Model<TestResultDocument>,
    @InjectModel(UserStreak.name)
    private userStreakModel: Model<UserStreakDocument>,
    @InjectModel(StudyPlan.name)
    private studyPlanModel: Model<StudyPlanDocument>,
  ) {}

  async getStats(userId: string) {
    const latest = await this.testResultModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .select('score listeningScore readingScore createdAt')
      .sort({ createdAt: -1 })
      .exec();

    const streak = await this.userStreakModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .select('currentStreak longestStreak lastStudyDate')
      .exec();

    return {
      estimatedScore: latest?.score || 0,
      listeningScore: latest?.listeningScore || 0,
      readingScore: latest?.readingScore || 0,
      targetScore: 850,
      streak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
    };
  }

  async getStreakHistory(userId: string) {
    const streak = await this.userStreakModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .select('currentStreak longestStreak')
      .exec();

    const testResults = await this.testResultModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('createdAt')
      .sort({ createdAt: 1 })
      .exec();

    const activeDates = Array.from(
      new Set(testResults.map((r) => new Date(r.createdAt).toISOString().split('T')[0])),
    );

    return {
      streak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      activeDates,
    };
  }

  async getTodayPlan(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.studyPlanModel
      .find({ userId: new Types.ObjectId(userId), planDate: today })
      .exec();
    return data || [];
  }

  async getScoreProgression(userId: string) {
    const data = await this.testResultModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('score createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return data.reverse().map((r: any) => ({
      date: new Date(r.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      score: r.score,
    }));
  }

  async getRecentTests(userId: string) {
    const data = await this.testResultModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('score listeningScore readingScore durationMinutes createdAt status testSetId')
      .populate({
        path: 'testSetId',
        select: 'name total_questions parts_count'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    return data.map((item: any) => {
      const doc = item.toObject();
      if (doc.testSetId) {
        doc.test_sets = doc.testSetId;
        delete doc.testSetId;
      }
      return doc;
    });
  }
}
