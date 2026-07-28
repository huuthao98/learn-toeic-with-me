import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { B1Set, B1SetDocument } from './schemas/b1-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { B1Question, B1QuestionDocument } from './schemas/b1-question.schema';
import { CreateB1QuestionDto } from './dto/b1-question.dto';
import { UserStreak, UserStreakDocument } from '../dashboard/schemas/user-streak.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class B1Service {
  constructor(
    @InjectModel(B1Set.name) private b1SetModel: Model<B1SetDocument>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResultDocument>,
    @InjectModel(B1Question.name) private questionModel: Model<B1QuestionDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
    private readonly usersService: UsersService,
  ) {}

  async checkAccess(testSetId: string, user?: any) {
    const testSet = await this.b1SetModel.findById(testSetId).exec();
    if (!testSet) throw new NotFoundException('B1 Test set not found');

    if (testSet.accessLevel === 'internal') {
      if (!user) {
        throw new ForbiddenException('Vui lòng đăng nhập để truy cập đề thi nội bộ');
      }
      if (user.role === 'admin') {
        return testSet;
      }
      const dbUser = await this.usersService.findOne(user.sub);
      const vstepPkg = dbUser.vipPackages?.find((pkg: any) => pkg.category === 'VSTEP');
      if (!vstepPkg || !['vip1', 'vip2', 'vip3'].includes(vstepPkg.vipLevel)) {
        throw new ForbiddenException('Yêu cầu tài khoản VIP phân hệ VSTEP để truy cập đề thi này');
      }
    }
    return testSet;
  }

  async getQuestions(testSetId: string, user?: any, skip = 0, limit = 0) {
    await this.checkAccess(testSetId, user);
    let query = this.questionModel.find({ testSetId: new Types.ObjectId(testSetId) }).sort({ skill: 1, questionNumber: 1 });
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return query.exec();
  }

  async upsertBulkQuestions(testSetId: string, questions: Partial<CreateB1QuestionDto & { questionNumber?: number }>[]) {
    const bulkOps = questions.map((q) => {
      const updateData: any = {};
      if (q.skill !== undefined) updateData.skill = q.skill;
      if (q.part !== undefined) updateData.part = q.part;
      if (q.questionNumber !== undefined) updateData.questionNumber = q.questionNumber;
      if (q.questionText !== undefined) updateData.questionText = q.questionText;
      if (q.correctAnswer) updateData.correctAnswer = q.correctAnswer;
      if (q.explanation !== undefined) updateData.explanation = q.explanation;
      if (q.options !== undefined) updateData.options = q.options;
      if (q.isActive !== undefined) updateData.status = q.isActive ? 'active' : 'draft';
      
      if (q.passageContext !== undefined) updateData.passageContext = q.passageContext;
      if (q.passageType !== undefined) updateData.passageType = q.passageType;
      if (q.setId !== undefined) updateData.setId = q.setId;
      if (q.note !== undefined) updateData.note = q.note;
      if (q.questionType !== undefined) updateData.questionType = q.questionType;

      // Filter to upsert
      const filter: any = { testSetId: new Types.ObjectId(testSetId) };
      
      // We identify questions either by questionNumber (plus skill/part if available) or by skill + part + setId for essays
      if (q.questionNumber) {
        filter.questionNumber = q.questionNumber;
        if (q.skill) filter.skill = q.skill;
        if (q.part) filter.part = q.part;
      } else if (q.skill && q.part) {
        filter.skill = q.skill;
        filter.part = q.part;
        if (q.setId) filter.setId = q.setId;
      }

      return {
        updateOne: {
          filter,
          update: { $set: updateData },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      await this.questionModel.bulkWrite(bulkOps);
    }
    return { message: 'Questions updated successfully' };
  }

  async updateQuestion(questionId: string, data: Partial<CreateB1QuestionDto>) {
    const question = await this.questionModel.findByIdAndUpdate(
      questionId,
      { $set: data },
      { new: true },
    ).exec();
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async getTestSets(status?: string, user?: any) {
    const query: any = {};
    if (status) query.status = status;

    let userVipLevel = 'vip0';
    let isAdmin = false;

    if (user) {
      if (user.role === 'admin') {
        isAdmin = true;
      } else {
        try {
          const dbUser = await this.usersService.findOne(user.sub);
          const vstepPkg = dbUser.vipPackages?.find((pkg: any) => pkg.category === 'VSTEP');
          userVipLevel = vstepPkg?.vipLevel || 'vip0';
        } catch (e) {
          // Ignore and default to vip0
        }
      }
    }

    if (!isAdmin) {
      const allowedLevels = ['external'];
      if (user) {
        allowedLevels.push('vip0');
        if (userVipLevel === 'vip1') {
          allowedLevels.push('vip1');
        } else if (userVipLevel === 'vip2') {
          allowedLevels.push('vip1', 'vip2');
        } else if (userVipLevel === 'vip3') {
          allowedLevels.push('vip1', 'vip2', 'vip3');
        }
      }
      query.$or = [
        { accessLevel: { $in: allowedLevels } },
        { accessLevel: { $exists: false } },
        { accessLevel: null }
      ];
    }

    const matchStage = { $match: query };

    return this.b1SetModel.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'b1questions',
          localField: '_id',
          foreignField: 'testSetId',
          as: 'questions',
        },
      },
      {
        $addFields: {
          totalQuestions: { $size: '$questions' },
        },
      },
      {
        $project: {
          questions: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  }

  async getTestSetById(id: string, user?: any) {
    return this.checkAccess(id, user);
  }

  async createTestSet(data: {
    name: string;
    description?: string;
    audioUrl?: string;
    status?: string;
    accessLevel?: string;
    topics?: string[];
  }) {
    const newSet = new this.b1SetModel(data);
    return newSet.save();
  }

  async updateTestSet(
    id: string,
    data: {
      name?: string;
      description?: string;
      audioUrl?: string;
      status?: string;
      accessLevel?: string;
    },
  ) {
    const updated = await this.b1SetModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('B1 Test set not found');
    return updated;
  }

  async deleteTestSet(id: string) {
    const deleted = await this.b1SetModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('B1 Test set not found');
    
    await this.questionModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();
    return { message: 'Deleted successfully' };
  }

  async getTestResult(resultId: string) {
    const result = await this.testResultModel.findById(resultId).exec();
    if (!result) throw new NotFoundException('Test result not found');
    return result;
  }

  async submitExam(
    user: any,
    testSetId: string,
    data: {
      answers: { [questionId: string]: string };
      durationMinutes?: number;
      timePerQuestion?: number[];
      isTest?: boolean;
    },
  ) {
    await this.checkAccess(testSetId, user);
    const { answers, durationMinutes, timePerQuestion = [], isTest = true } = data;

    const questions = await this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .exec();

    if (!questions.length) {
      throw new BadRequestException('No questions found for this test set');
    }

    let listeningCorrect = 0;
    let readingCorrect = 0;
    let totalListening = 0;
    let totalReading = 0;

    for (const q of questions) {
      if (q.questionType === 'multiple_choice') {
        const userAnswer = answers[q._id.toString()];
        const isCorrect = userAnswer === q.correctAnswer;
        
        if (q.skill === 'listening') {
          totalListening++;
          if (isCorrect) listeningCorrect++;
        } else if (q.skill === 'reading') {
          totalReading++;
          if (isCorrect) readingCorrect++;
        }
      }
    }

    // Standard VSTEP scoring (out of 10 per skill)
    const listeningScore = totalListening > 0 ? (listeningCorrect / totalListening) * 10 : 0;
    const readingScore = totalReading > 0 ? (readingCorrect / totalReading) * 10 : 0;
    
    // Total score is the average of 4 skills. Since writing and speaking are manual, we only average what we have for now, or just leave it.
    // Usually VSTEP is (L + R + W + S) / 4. 
    const score = (listeningScore + readingScore) / 2; // Temporary average

    let pointsCorrect = 0, pointsCompletion = 0, pointsPerfect = 0, pointsSpeed = 0, pointsStreak = 0;

    const correctCount = listeningCorrect + readingCorrect;
    pointsCorrect = correctCount * 2;
    if (isTest) pointsCompletion = 50;
    
    if (correctCount === (totalListening + totalReading) && (totalListening + totalReading) > 0) {
      pointsPerfect = 100;
    }

    const maxConsecutiveSpeed = this.calculateSpeedDemonStreak(timePerQuestion);
    if (maxConsecutiveSpeed >= 5) {
      pointsSpeed = 10;
    }
    
    if (!user) {
      // Guest mode
      const totalEarned = pointsCorrect + pointsCompletion + pointsPerfect + pointsSpeed;
      return {
        resultId: null,
        score,
        listeningScore,
        readingScore,
        writingScore: 0,
        speakingScore: 0,
        correctCount,
        totalQuestions: totalListening + totalReading,
        totalEarned,
        currentStreak: 0,
        breakdown: {
          correctAnswers: pointsCorrect,
          lessonCompletion: pointsCompletion,
          perfectLesson: pointsPerfect,
          streakBonus: 0,
          speedDemon: pointsSpeed,
        }
      };
    }

    // Save test result
    const result = new this.testResultModel({
      userId: new Types.ObjectId(user.sub),
      testType: 'B1Set',
      testSetId: new Types.ObjectId(testSetId),
      score,
      listeningScore,
      readingScore,
      writingScore: 0,
      speakingScore: 0,
      durationMinutes: durationMinutes || 0,
      status: 'completed',
      answers,
    });

    await result.save();

    const currentStreak = await this.updateUserStreak(user.sub);
    pointsStreak = currentStreak > 0 ? Math.min(currentStreak, 10) * 2 : 0;

    const totalEarned = pointsCorrect + pointsCompletion + pointsPerfect + pointsSpeed + pointsStreak;

    // Gamification
    await this.usersService.addPoints(user.sub, 'VSTEP', totalEarned);

    return {
      resultId: result._id,
      score,
      listeningScore,
      readingScore,
      writingScore: 0,
      speakingScore: 0,
      correctCount,
      totalQuestions: totalListening + totalReading,
      currentStreak,
      totalEarned,
      breakdown: {
        correctAnswers: pointsCorrect,
        lessonCompletion: pointsCompletion,
        perfectLesson: pointsPerfect,
        streakBonus: pointsStreak,
        speedDemon: pointsSpeed,
      }
    };
  }

  private calculateSpeedDemonStreak(times: number[]): number {
    if (!times || times.length === 0) return 0;
    let max = 0;
    let current = 0;
    for (const t of times) {
      if (t < 5000) {
        current++;
        if (current > max) max = current;
      } else {
        current = 0;
      }
    }
    return max;
  }

  private async updateUserStreak(userId: string): Promise<number> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let userStreak = await this.userStreakModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!userStreak) {
      userStreak = new this.userStreakModel({
        userId: new Types.ObjectId(userId),
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: today,
      });
      await userStreak.save();
      return 1;
    }

    const lastActivity = userStreak.lastStudyDate ? new Date(userStreak.lastStudyDate) : null;
    if (!lastActivity) {
      userStreak.currentStreak = 1;
      userStreak.lastStudyDate = today;
    } else {
      const lastActivityDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
      const diffTime = Math.abs(today.getTime() - lastActivityDay.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        userStreak.currentStreak += 1;
        if (userStreak.currentStreak > userStreak.longestStreak) {
          userStreak.longestStreak = userStreak.currentStreak;
        }
      } else if (diffDays > 1) {
        userStreak.currentStreak = 1;
      }
      userStreak.lastStudyDate = today;
    }

    await userStreak.save();
    return userStreak.currentStreak;
  }
}
