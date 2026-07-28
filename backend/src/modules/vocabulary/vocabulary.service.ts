import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VocabularySet, VocabularySetDocument } from './schemas/vocabulary-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { VocabularyQuestion, VocabularyQuestionDocument } from './schemas/vocabulary-question.schema';
import { CreateVocabularyQuestionDto } from './dto/vocabulary-question.dto';
import { UserStreak, UserStreakDocument } from '../dashboard/schemas/user-streak.schema';

import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class VocabularyService {
  constructor(
    @InjectModel(VocabularySet.name) private vocabularySetModel: Model<VocabularySetDocument>,
    @InjectModel(TestResult.name) private TestResultModel: Model<TestResultDocument>,
    @InjectModel(VocabularyQuestion.name) private questionModel: Model<VocabularyQuestionDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async getQuestions(testSetId: string) {
    return this.questionModel.find({ testSetId: new Types.ObjectId(testSetId) }).sort({ questionNumber: 1 }).exec();
  }

  async upsertBulkQuestions(testSetId: string, questions: Partial<CreateVocabularyQuestionDto & { questionNumber: number }>[]) {
    const bulkOps = questions.map((q) => {
      const updateData: any = {};
      if (q.questionNumber !== undefined) updateData.questionNumber = q.questionNumber;
      if (q.questionText !== undefined) updateData.questionText = q.questionText;
      if (q.correctAnswer) updateData.correctAnswer = q.correctAnswer;
      if (q.explanation !== undefined) updateData.explanation = q.explanation;
      if (q.options !== undefined) updateData.options = q.options;
      if (q.pinyin !== undefined) updateData.pinyin = q.pinyin;
      if (q.isActive !== undefined) updateData.status = q.isActive ? 'active' : 'draft';

      return {
        updateOne: {
          filter: {
            testSetId: new Types.ObjectId(testSetId),
            questionNumber: q.questionNumber,
          },
          update: { $set: updateData },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      await this.questionModel.bulkWrite(bulkOps);
    }
    return { message: `Upserted ${questions.length} questions` };
  }

  async updateQuestion(questionId: string, data: any) {
    const question = await this.questionModel.findByIdAndUpdate(
      questionId,
      { $set: data },
      { new: true },
    ).exec();
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async deleteQuestion(questionId: string) {
    const question = await this.questionModel.findByIdAndDelete(questionId).exec();
    if (!question) throw new NotFoundException('Question not found');
    return { message: 'Question deleted successfully' };
  }

  async findAll(status?: string, category?: string, user?: any) {
    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;

    if (!user || (user.role !== 'admin' && user.role !== 'operator')) {
      const allowedConditions: any[] = [{ accessLevel: 'external' }];
      
      if (user) {
        allowedConditions.push({ accessLevel: 'vip0' });
        
        for (const pkg of (user.vipPackages || [])) {
          if (pkg.vipLevel === 'vip1') {
            allowedConditions.push({ category: pkg.category, accessLevel: 'vip1' });
          } else if (pkg.vipLevel === 'vip2') {
            allowedConditions.push({ category: pkg.category, accessLevel: { $in: ['vip1', 'vip2'] } });
          } else if (pkg.vipLevel === 'vip3') {
            allowedConditions.push({ category: pkg.category, accessLevel: { $in: ['vip1', 'vip2', 'vip3'] } });
          }
        }
      }
      query.$or = allowedConditions;
    }

    const matchStage = { $match: query };

    return this.vocabularySetModel.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'vocabularyquestions',
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

  async findOne(id: string, user?: any) {
    const vocabularySet = await this.vocabularySetModel.findById(id).lean().exec();
    if (!vocabularySet) {
      throw new NotFoundException('Vocabulary set not found');
    }

    const totalQuestions = await this.questionModel.countDocuments({ testSetId: new Types.ObjectId(id) });
    const result = { ...vocabularySet, totalQuestions };

    if (user?.role === 'admin' || user?.role === 'operator') {
      return result;
    }

    const access = result.accessLevel || 'external';
    if (access === 'external') return result;

    if (!user) {
      throw new ForbiddenException('You must log in to view this test');
    }

    const pkg = (user.vipPackages || []).find((p: any) => p.category === result.category) || { vipLevel: 'vip0' };
    const level = pkg.vipLevel;

    let hasAccess = false;
    if (access === 'vip0') hasAccess = true;
    else if (access === 'vip1' && ['vip1', 'vip2', 'vip3'].includes(level)) hasAccess = true;
    else if (access === 'vip2' && ['vip2', 'vip3'].includes(level)) hasAccess = true;
    else if (access === 'vip3' && level === 'vip3') hasAccess = true;

    if (!hasAccess) {
      throw new ForbiddenException(`This test requires ${access} access level.`);
    }

    return result;
  }

  async create(dto: {
    name: string;
    description?: string;
    status?: string;
    category?: string;
    topics?: string[];
    notifyUsers?: boolean;
  }) {
    const existingTest = await this.vocabularySetModel.findOne({ name: dto.name }).exec();
    if (existingTest) {
      throw new BadRequestException('Tên bộ từ vựng đã tồn tại. Vui lòng chọn tên khác.');
    }

    const newVocabularySet = new this.vocabularySetModel({
      name: dto.name,
      description: dto.description,
      status: dto.status || 'draft',
      accessLevel: (dto as any).accessLevel || 'external',
      category: dto.category,
      topics: dto.topics || [],
    });
    
    const savedTest = await newVocabularySet.save();

    if (dto.notifyUsers && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async findQuestions(testSetId: string, user?: any, skip = 0, limit = 0) {
    await this.findOne(testSetId, user); // check access
    
    let query = this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .sort({ questionNumber: 1 });
      
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    
    return query.exec();
  }

  async findResult(resultId: string) {
    const result = await this.TestResultModel
      .findById(resultId)
      .populate('testSetId', 'name')
      .exec();
    if (!result) {
      throw new NotFoundException('Test result not found');
    }
    return result;
  }

  async submitExam(
    user: any,
    testSetId: string,
    answers: { [questionId: string]: string },
    durationMinutes?: number,
    timePerQuestion?: number[],
    isTest?: boolean,
    isReview?: boolean,
    isTestOut?: boolean,
    isRescueStreak?: boolean,
  ) {
    await this.findOne(testSetId, user);

    const questions = await this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .exec();
    if (questions.length === 0) {
      throw new NotFoundException('No questions found for this test set');
    }

    let correctCount = 0;
    let maxConsecutiveSpeed = 0;
    let currentConsecutiveSpeed = 0;

    questions.forEach((q, index) => {
      const userAnswer = answers[q._id.toString()];
      const isCorrect = userAnswer && userAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
      
      if (isCorrect) {
        correctCount++;
        if (timePerQuestion && timePerQuestion[index] !== undefined && timePerQuestion[index] <= 5) {
           currentConsecutiveSpeed++;
           if (currentConsecutiveSpeed > maxConsecutiveSpeed) maxConsecutiveSpeed = currentConsecutiveSpeed;
        } else {
           currentConsecutiveSpeed = 0;
        }
      } else {
        currentConsecutiveSpeed = 0;
      }
    });

    const isPass = questions.length > 0 && (correctCount / questions.length) >= 0.8;
    
    // Gamification Points Calculation
    let pointsCorrect = correctCount * (isReview ? 4 : 2);
    let pointsCompletion = 0;
    let pointsPerfect = 0;
    let pointsSpeed = 0;
    let pointsTestOut = 0;
    let pointsStreak = 0;
    
    if (isTest) {
      if (isPass) pointsCompletion = 150;
    } else {
      pointsCompletion = 15;
    }
    
    if (correctCount === questions.length && questions.length > 0) {
      pointsPerfect = 20;
    }
    
    if (maxConsecutiveSpeed >= 5) {
      pointsSpeed = 10;
    }
    
    if (isTestOut && isPass) {
      pointsTestOut = 500;
    }

    if (!user) {
      const totalEarned = pointsCorrect + pointsCompletion + pointsPerfect + pointsSpeed + pointsTestOut;
      return {
        resultId: null,
        totalEarned,
        breakdown: {
          correctAnswers: pointsCorrect,
          lessonCompletion: pointsCompletion,
          perfectLesson: pointsPerfect,
          streakBonus: 0,
          speedDemon: pointsSpeed,
          testOut: pointsTestOut,
        },
        currentStreak: 0,
      };
    }

    // Save test result
    const result = new this.TestResultModel({
      userId: new Types.ObjectId(user.sub),
      testType: 'VocabularySet',
      testSetId: new Types.ObjectId(testSetId),
      score: correctCount,
      listeningScore: 0,
      readingScore: 0,
      durationMinutes: durationMinutes || 0,
      status: 'completed',
      answers,
    });

    await result.save();

    // Streak logic
    const { currentStreak, awardedChest, isFirstOfToday } = await this.updateUserStreak(user.sub, isRescueStreak);
    
    if (isFirstOfToday) pointsStreak += 10;
    if (awardedChest === 'small') pointsStreak += 50;
    if (awardedChest === 'large') pointsStreak += 150;
    
    const totalEarned = pointsCorrect + pointsCompletion + pointsPerfect + pointsSpeed + pointsTestOut + pointsStreak;

    const vocabularySet = await this.vocabularySetModel.findById(testSetId).exec();
    if (vocabularySet?.category) {
       await this.usersService.addPoints(user.sub, vocabularySet.category, totalEarned);
    }

    return {
      resultId: result._id,
      totalEarned,
      breakdown: {
        correctAnswers: pointsCorrect,
        lessonCompletion: pointsCompletion,
        perfectLesson: pointsPerfect,
        streakBonus: pointsStreak,
        speedDemon: pointsSpeed,
        testOut: pointsTestOut,
      },
      currentStreak,
    };
  }

  async update(
    id: string,
    dto: {
      name?: string;
      description?: string;
      status?: string;
      category?: string;
      topics?: string[];
      notifyUsers?: boolean;
    },
  ) {
    const vocabularySet = await this.vocabularySetModel.findById(id).exec();
    if (!vocabularySet) {
      throw new NotFoundException('Vocabulary set not found');
    }
    const wasDraft = vocabularySet.status !== 'public';
    
    if (dto.name !== undefined) vocabularySet.name = dto.name;
    if (dto.description !== undefined) vocabularySet.description = dto.description;
    if (dto.status !== undefined) vocabularySet.status = dto.status;
    if ((dto as any).accessLevel !== undefined) vocabularySet.accessLevel = (dto as any).accessLevel;
    if (dto.category !== undefined) vocabularySet.category = dto.category;
    if (dto.topics !== undefined) vocabularySet.topics = dto.topics;
    
    const savedTest = await vocabularySet.save();

    if (dto.notifyUsers && wasDraft && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async delete(id: string) {
    const vocabularySet = await this.vocabularySetModel.findById(id).exec();
    if (!vocabularySet) {
      throw new NotFoundException('Vocabulary set not found');
    }

    // Cascading delete questions belonging to this test set
    await this.questionModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();

    // Cascading delete test results belonging to this test set
    await this.TestResultModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();

    // Delete the test set itself
    await this.vocabularySetModel.findByIdAndDelete(id).exec();

    return { message: 'Vocabulary set and all associated questions/results deleted successfully' };
  }

  private async handleTestNotification(savedTest: any) {
    if (savedTest.topics && savedTest.topics.length > 0) {
      this.notificationsService.sendNotification({
        title: 'Chủ đề từ vựng mới!',
        body: `Chủ đề từ vựng "${savedTest.name}" thuộc chủ đề bạn quan tâm vừa được công khai.`,
        topics: savedTest.topics,
        data: { testId: savedTest._id.toString(), type: 'vocabulary' },
      }).catch(err => console.error('Error triggering notification:', err));
    }
  }

  private async updateUserStreak(userId: string, isRescueStreak?: boolean): Promise<{ currentStreak: number, awardedChest: string | null, isFirstOfToday: boolean }> {
    const todayStr = new Date().toISOString().split('T')[0];
    let streak = await this.userStreakModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    let awardedChest: string | null = null;
    let isFirstOfToday = false;

    if (!streak) {
      streak = new this.userStreakModel({
        userId: new Types.ObjectId(userId),
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: new Date(todayStr),
      });
      isFirstOfToday = true;
    } else {
      const lastStudyStr = streak.lastStudyDate
        ? new Date(streak.lastStudyDate).toISOString().split('T')[0]
        : null;

      if (lastStudyStr !== todayStr) {
        isFirstOfToday = true;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastStudyStr === yesterdayStr) {
          streak.currentStreak += 1;
        } else {
          if (isRescueStreak) {
            streak.currentStreak += 1;
          } else {
            streak.currentStreak = 1;
          }
        }

        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
        streak.lastStudyDate = new Date(todayStr);
      }
    }
    
    // Check chest if they made progress today
    if (isFirstOfToday && streak.currentStreak > 0) {
       if (streak.currentStreak % 7 === 0) awardedChest = 'large';
       else if (streak.currentStreak % 3 === 0) awardedChest = 'small';
    }

    await streak.save();
    return { currentStreak: streak.currentStreak, awardedChest, isFirstOfToday };
  }
}
