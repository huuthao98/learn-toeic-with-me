import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ToeicSet, ToeicSetDocument } from './schemas/toeic-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { ToeicQuestion, ToeicQuestionDocument } from './schemas/toeic-question.schema';
import { CreateToeicQuestionDto } from './dto/toeic-question.dto';
import { UserStreak, UserStreakDocument } from '../dashboard/schemas/user-streak.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ToeicService {
  constructor(
    @InjectModel(ToeicSet.name) private ToeicSetModel: Model<ToeicSetDocument>,
    @InjectModel(TestResult.name) private TestResultModel: Model<TestResultDocument>,
    @InjectModel(ToeicQuestion.name) private questionModel: Model<ToeicQuestionDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getQuestions(testSetId: string, user?: any, skip = 0, limit = 0) {
    await this.checkAccess(testSetId, user);
    let query = this.questionModel.find({ testSetId: new Types.ObjectId(testSetId) }).sort({ questionNumber: 1 });
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return query.exec();
  }

  async upsertBulkQuestions(testSetId: string, questions: Partial<CreateToeicQuestionDto & { questionNumber: number }>[]) {
    const bulkOps = questions.map((q) => {
      const updateData: any = {};
      if (q.questionNumber !== undefined) updateData.questionNumber = q.questionNumber;
      if (q.questionText !== undefined) updateData.questionText = q.questionText;
      if (q.correctAnswer) updateData.correctAnswer = q.correctAnswer;
      if (q.explanation !== undefined) updateData.explanation = q.explanation;
      if (q.options !== undefined) updateData.options = q.options;
      if (q.part !== undefined) updateData.part = q.part;
      if (q.isActive !== undefined) updateData.status = q.isActive ? 'active' : 'draft';
      
      // New fields for reading
      if ((q as any).passageContext !== undefined) updateData.passageContext = (q as any).passageContext;
      if ((q as any).passageType !== undefined) updateData.passageType = (q as any).passageType;
      if ((q as any).setId !== undefined) updateData.setId = (q as any).setId;
      if ((q as any).blankPosition !== undefined) updateData.blankPosition = (q as any).blankPosition;
      if ((q as any).note !== undefined) updateData.note = (q as any).note;
      if ((q as any).questionType !== undefined) updateData.questionType = (q as any).questionType;

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

  async updateQuestion(questionId: string, dto: any) {
    const question = await this.questionModel.findById(questionId).exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (dto.questionNumber !== undefined) question.questionNumber = dto.questionNumber;
    if (dto.questionText !== undefined) question.questionText = dto.questionText;
    if (dto.correctAnswer !== undefined) question.correctAnswer = dto.correctAnswer;
    if (dto.explanation !== undefined) question.explanation = dto.explanation;
    if (dto.options !== undefined) question.options = dto.options;
    if (dto.part !== undefined) question.part = dto.part;
    if (dto.passageContext !== undefined) (question as any).passageContext = dto.passageContext;
    if (dto.passageType !== undefined) (question as any).passageType = dto.passageType;
    if (dto.setId !== undefined) (question as any).setId = dto.setId;
    if (dto.blankPosition !== undefined) (question as any).blankPosition = dto.blankPosition;
    if (dto.audioUrl !== undefined) (question as any).audioUrl = dto.audioUrl;
    if (dto.imageUrl !== undefined) (question as any).imageUrl = dto.imageUrl;
    if (dto.status !== undefined) question.status = dto.status;

    return question.save();
  }

  async deleteQuestion(questionId: string) {
    const result = await this.questionModel.findByIdAndDelete(questionId).exec();
    if (!result) {
      throw new NotFoundException('Question not found');
    }
    return { message: 'Question deleted successfully' };
  }


  async checkAccess(testSetId: string, user?: any) {
    const testSet = await this.ToeicSetModel.findById(testSetId).exec();
    if (!testSet) throw new NotFoundException('Toeic set not found');

    const requiredAccess = testSet.accessLevel || 'external';

    // If it's public external, everyone has access
    if (requiredAccess === 'external') {
      return testSet;
    }

    // For any VIP level (vip0, vip1, vip2, vip3), the user must be authenticated
    if (!user) {
      throw new ForbiddenException('Vui lòng đăng nhập để truy cập nội dung này');
    }

    // Admin has access to all levels
    if (user.role === 'admin') {
      return testSet;
    }

    // vip0 means any authenticated user can access
    if (requiredAccess === 'vip0') {
      return testSet;
    }

    // Otherwise, check specific TOEIC VIP level
    const dbUser = await this.usersService.findOne(user.sub);
    const toeicPkg = dbUser.vipPackages?.find((pkg: any) => pkg.category === 'TOEIC');
    const userVipLevel = toeicPkg?.vipLevel || 'vip0';

    const VIP_MAP: Record<string, number> = {
      vip0: 0,
      vip1: 1,
      vip2: 2,
      vip3: 3,
    };

    const userScore = VIP_MAP[userVipLevel] ?? 0;
    const requiredScore = VIP_MAP[requiredAccess] ?? 0;

    if (userScore < requiredScore) {
      throw new ForbiddenException(`Yêu cầu tài khoản đạt cấp độ ${requiredAccess.toUpperCase()} phân hệ TOEIC để truy cập đề thi này`);
    }

    return testSet;
  }

  async findAll(status?: string, type?: string, user?: any) {
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    let userVipLevel = 'vip0';
    let isAdmin = false;

    if (user) {
      if (user.role === 'admin') {
        isAdmin = true;
      } else {
        try {
          const dbUser = await this.usersService.findOne(user.sub);
          const toeicPkg = dbUser.vipPackages?.find((pkg: any) => pkg.category === 'TOEIC');
          userVipLevel = toeicPkg?.vipLevel || 'vip0';
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
      query.accessLevel = { $in: allowedLevels };
    }

    const matchStage = { $match: query };

    return this.ToeicSetModel.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'toeicquestions',
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
    return this.checkAccess(id, user);
  }

  async create(dto: {
    name: string;
    description?: string;
    audioUrl?: string;
    status?: string;
    readingPdfUrl?: string;
    listeningPdfUrl?:string;
    topics?: string[];
    notifyUsers?: boolean;
    type?: string;
  }) {
    const existingTest = await this.ToeicSetModel.findOne({ name: dto.name }).exec();
    if (existingTest) {
      throw new BadRequestException('Tên đề thi đã tồn tại. Vui lòng chọn tên khác.');
    }

    const newToeicSet = new this.ToeicSetModel({
      name: dto.name,
      description: dto.description,
      audioUrl: dto.audioUrl,
      status: dto.status || 'draft',
      readingPdfUrl: dto.readingPdfUrl,
      listeningPdfUrl: dto.listeningPdfUrl,
      topics: dto.topics || [],
      type: dto.type,
    });
    
    const savedTest = await newToeicSet.save();

    if (dto.notifyUsers && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async findQuestions(testSetId: string, user?: any) { // Keeping parameter name simple
    await this.checkAccess(testSetId, user);
    return this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .sort({ part: 1, createdAt: 1 })
      .exec();
  }

  async findResult(resultId: string) {
    const result = await this.TestResultModel
      .findById(resultId)
      .populate({ path: 'testSetId', model: 'ToeicSet', select: 'name total_questions parts_count' })
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
    isTest: boolean = false
  ) {
    await this.checkAccess(testSetId, user);

    // Fetch all questions for this test set
    const questions = await this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .exec();
    if (questions.length === 0) {
      throw new NotFoundException('No questions found for this test set');
    }

    let correctCount = 0;
    let listeningCorrect = 0;
    let readingCorrect = 0;
    let listeningTotal = 0;
    let readingTotal = 0;
    let maxConsecutiveSpeed = 0;
    let currentSpeedStreak = 0;

    questions.forEach((q, index) => {
      const userAnswer = answers[q._id.toString()];
      const isCorrect = userAnswer && userAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
      
      if (isCorrect) correctCount++;

      const part = q.part || '';
      const isListening = ['1', '2', '3', '4'].includes(part);
      const isReading = ['5', '6', '7'].includes(part);

      if (isListening) {
        listeningTotal++;
        if (isCorrect) listeningCorrect++;
      } else if (isReading) {
        readingTotal++;
        if (isCorrect) readingCorrect++;
      }
      
      const timeSpent = timePerQuestion && timePerQuestion.length > index ? timePerQuestion[index] : 10000;
      if (isCorrect && timeSpent <= 5000) {
        currentSpeedStreak++;
        if (currentSpeedStreak > maxConsecutiveSpeed) {
          maxConsecutiveSpeed = currentSpeedStreak;
        }
      } else {
        currentSpeedStreak = 0;
      }
    });

    let score = 0;
    let listeningScore = 0;
    let readingScore = 0;

    // Simplified TOEIC Score Calculation (Approximate based on correct answers percentage)
    // Actually standard is mapping, but using ratio * 495 is okay for gamification
    listeningScore = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 495) : 0;
    readingScore = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 495) : 0;
    score = listeningScore + readingScore;
    if (score > 990) score = 990;
    
    // Gamification Points Calculation
    let pointsCorrect = correctCount * 2;
    let pointsCompletion = isTest ? 150 : 15;
    let pointsPerfect = 0;
    let pointsSpeed = 0;
    let pointsStreak = 0;
    
    if (correctCount === questions.length && questions.length > 0) {
      pointsPerfect = 20;
    }
    
    if (maxConsecutiveSpeed >= 5) {
      pointsSpeed = 10;
    }

    if (!user) {
      const totalEarned = pointsCorrect + pointsCompletion + pointsPerfect + pointsSpeed;
      return {
        resultId: null,
        totalEarned,
        breakdown: {
          correctAnswers: pointsCorrect,
          lessonCompletion: pointsCompletion,
          perfectLesson: pointsPerfect,
          streakBonus: 0,
          speedDemon: pointsSpeed,
          testOut: 0,
        },
        currentStreak: 0,
        score,
        listeningScore,
        readingScore,
        correctCount,
        totalQuestions: questions.length,
      };
    }

    // Save test result
    const result = new this.TestResultModel({
      userId: new Types.ObjectId(user.sub),
      testType: 'ToeicSet',
      testSetId: new Types.ObjectId(testSetId),
      score,
      listeningScore,
      readingScore,
      durationMinutes: durationMinutes || 0,
      status: 'completed',
      answers,
    });

    await result.save();

    const currentStreak = await this.updateUserStreak(user.sub);
    pointsStreak = currentStreak > 0 ? Math.min(currentStreak, 10) * 2 : 0;

    const totalEarned = pointsCorrect + pointsCompletion + pointsPerfect + pointsSpeed + pointsStreak;

    // Give XP
    await this.usersService.addPoints(user.sub, 'TOEIC', totalEarned);

    return {
      resultId: result._id,
      score,
      listeningScore,
      readingScore,
      correctCount,
      totalQuestions: questions.length,
      currentStreak,
      totalEarned,
      breakdown: {
        correctAnswers: pointsCorrect,
        lessonCompletion: pointsCompletion,
        perfectLesson: pointsPerfect,
        streakBonus: pointsStreak,
        speedDemon: pointsSpeed,
        testOut: 0,
      }
    };
  }

  async update(
    id: string,
    dto: {
      name?: string;
      description?: string;
      audioUrl?: string;
      status?: string;
      readingPdfUrl?: string;
      listeningPdfUrl?: string;
      topics?: string[];
      notifyUsers?: boolean;
      type?: string;
    },
  ) {
    const ToeicSet = await this.findOne(id);
    const wasDraft = ToeicSet.status !== 'public';
    
    if (dto.name !== undefined) ToeicSet.name = dto.name;
    if (dto.description !== undefined) ToeicSet.description = dto.description;
    if (dto.audioUrl !== undefined) ToeicSet.audioUrl = dto.audioUrl;
    if (dto.status !== undefined) ToeicSet.status = dto.status;
    if (dto.readingPdfUrl !== undefined) ToeicSet.readingPdfUrl = dto.readingPdfUrl;
    if (dto.listeningPdfUrl !== undefined) ToeicSet.listeningPdfUrl = dto.listeningPdfUrl;
    if (dto.topics !== undefined) ToeicSet.topics = dto.topics;
    if (dto.type !== undefined) (ToeicSet as any).type = dto.type;
    
    const savedTest = await ToeicSet.save();

    if (dto.notifyUsers && wasDraft && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async delete(id: string) {
    const ToeicSet = await this.ToeicSetModel.findById(id).exec();
    if (!ToeicSet) {
      throw new NotFoundException('Toeic set not found');
    }

    // Cascading delete questions belonging to this test set
    await this.questionModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();

    // Cascading delete test results belonging to this test set
    await this.TestResultModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();

    // Delete the test set itself
    await this.ToeicSetModel.findByIdAndDelete(id).exec();

    return { message: 'Toeic set and all associated questions/results deleted successfully' };
  }

  private async handleTestNotification(savedTest: any) {
    if (savedTest.topics && savedTest.topics.length > 0) {
      this.notificationsService.sendNotification({
        title: 'Bài thi TOEIC mới!',
        body: `Đề thi TOEIC "${savedTest.name}" thuộc chủ đề bạn quan tâm vừa được công khai.`,
        topics: savedTest.topics,
        data: { testId: savedTest._id.toString(), type: 'toeic' },
      }).catch(err => console.error('Error triggering notification:', err));
    }
  }

  private async updateUserStreak(userId: string): Promise<number> {
    const todayStr = new Date().toISOString().split('T')[0];
    let streak = await this.userStreakModel.findOne({ userId: new Types.ObjectId(userId) }).exec();

    if (!streak) {
      streak = new this.userStreakModel({
        userId: new Types.ObjectId(userId),
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: new Date(todayStr),
      });
    } else {
      const lastStudyStr = streak.lastStudyDate
        ? new Date(streak.lastStudyDate).toISOString().split('T')[0]
        : null;

      if (lastStudyStr !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastStudyStr === yesterdayStr) {
          streak.currentStreak += 1;
        } else {
          streak.currentStreak = 1;
        }

        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
        streak.lastStudyDate = new Date(todayStr);
      }
    }
    await streak.save();
    return streak.currentStreak;
  }
}
