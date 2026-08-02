import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { ToeicSet, ToeicSetDocument } from './schemas/toeic-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { ToeicQuestion, ToeicQuestionDocument } from './schemas/toeic-question.schema';
import { UserStreak, UserStreakDocument } from '../dashboard/schemas/user-streak.schema';

import { CreateToeicQuestionDto } from './dto/toeic-question.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { CreateToeicSetDto } from '@/modules/toeic/dto/create-toeic-set.dto';
import { UpdateToeicSetDto } from '@/modules/toeic/dto/update-toeic-set.dto';


@Injectable()
export class ToeicService {
  constructor(
    @InjectModel(ToeicSet.name) private toeicSetModel: Model<ToeicSetDocument>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResultDocument>,
    @InjectModel(ToeicQuestion.name) private questionModel: Model<ToeicQuestionDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly accessControlService: AccessControlService,
  ) {}

  // ─── Question CRUD ───────────────────────────────────────────────────────────

  async getQuestions(testSetId: string, skip = 0, limit = 0) {
    let query = this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .sort({ questionNumber: 1 });
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return query.exec();
  }

  async upsertBulkQuestions(
    testSetId: string,
    questions: Partial<CreateToeicQuestionDto & { questionNumber: number }>[],
  ) {
    const bulkOps = questions.map((q) => {
      const updateData: any = {};
      if (q.questionNumber !== undefined) updateData.questionNumber = q.questionNumber;
      if (q.questionText !== undefined) updateData.questionText = q.questionText;
      if (q.correctAnswer) updateData.correctAnswer = q.correctAnswer;
      if (q.explanation !== undefined) updateData.explanation = q.explanation;
      if (q.options !== undefined) updateData.options = q.options;
      if (q.part !== undefined) updateData.part = q.part;
      if (q.isActive !== undefined) updateData.status = q.isActive ? 'active' : 'draft';

      // Fields for reading comprehension questions
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
    if (!question) throw new NotFoundException('Question not found');

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
    if (!result) throw new NotFoundException('Question not found');
    return { message: 'Question deleted successfully' };
  }

  // ─── Test Set CRUD ───────────────────────────────────────────────────────────

  async findAll(status?: string, type?: string, user?: any) {
    const baseQuery: any = {};
    if (status) baseQuery.status = status;
    if (type) baseQuery.type = type;

    // Lấy access filter từ AccessControlService (single source of truth)
    const accessFilter = await this.accessControlService.getAccessFilterQuery(user, 'TOEIC');

    // Kết hợp base query với access filter
    const matchQuery =
      Object.keys(accessFilter).length > 0
        ? { ...baseQuery, ...accessFilter }
        : baseQuery;

    return this.toeicSetModel.aggregate([
      { $match: matchQuery },
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

  async countQuestions(testSetId: string | Types.ObjectId) {
    return this.questionModel.countDocuments({ testSetId: new Types.ObjectId(testSetId) });
  }

  async findResult(resultId: string) {
    const result = await this.testResultModel
      .findById(resultId)
      .populate({ path: 'testSetId', model: 'ToeicSet', select: 'name totalQuestions partsCount' })
      .exec();
    if (!result) throw new NotFoundException('Test result not found');
    return result;
  }

  async create(dto: CreateToeicSetDto) {
    const existingTest = await this.toeicSetModel.findOne({ name: dto.name }).exec();
    if (existingTest) {
      throw new BadRequestException('Tên đề thi đã tồn tại. Vui lòng chọn tên khác.');
    }

    const newToeicSet = new this.toeicSetModel({
      name: dto.name,
      description: dto.description,
      audioUrl: dto.audioUrl,
      status: dto.status || 'draft',
      readingPdfUrl: dto.readingPdfUrl,
      listeningPdfUrl: dto.listeningPdfUrl,
      topics: dto.topics || [],
      type: dto.type,
      accessLevel: dto.accessLevel || 'external',
    });

    const savedTest = await newToeicSet.save();

    if (dto.notifyUsers && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async update(
    id: string,
    dto: UpdateToeicSetDto
  ) {
    // Fetch entity trực tiếp — không cần kiểm tra quyền vì đây là Admin-only route
    const toeicSet = await this.toeicSetModel.findById(id).exec();
    if (!toeicSet) throw new NotFoundException('Toeic set not found');

    const wasDraft = toeicSet.status !== 'public';

    if (dto.name !== undefined) toeicSet.name = dto.name;
    if (dto.description !== undefined) toeicSet.description = dto.description;
    if (dto.audioUrl !== undefined) toeicSet.audioUrl = dto.audioUrl;
    if (dto.status !== undefined) toeicSet.status = dto.status;
    if (dto.readingPdfUrl !== undefined) toeicSet.readingPdfUrl = dto.readingPdfUrl;
    if (dto.listeningPdfUrl !== undefined) toeicSet.listeningPdfUrl = dto.listeningPdfUrl;
    if (dto.topics !== undefined) toeicSet.topics = dto.topics;
    if (dto.type !== undefined) (toeicSet as any).type = dto.type;
    if (dto.accessLevel !== undefined) toeicSet.accessLevel = dto.accessLevel;

    const savedTest = await toeicSet.save();

    if (dto.notifyUsers && wasDraft && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async delete(id: string) {
    const toeicSet = await this.toeicSetModel.findById(id).exec();
    if (!toeicSet) throw new NotFoundException('Toeic set not found');

    // Cascading delete: questions → results → test set
    await this.questionModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();
    await this.testResultModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();
    await this.toeicSetModel.findByIdAndDelete(id).exec();

    return { message: 'Toeic set and all associated questions/results deleted successfully' };
  }

  // ─── Submit & Scoring ────────────────────────────────────────────────────────

  async submitExam(
    user: any,
    testSetId: string,
    answers: { [questionId: string]: string },
    durationMinutes?: number,
    timePerQuestion?: number[],
    isTest: boolean = false,
  ) {

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
      const isCorrect =
        userAnswer && userAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();

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

      const timeSpent =
        timePerQuestion && timePerQuestion.length > index ? timePerQuestion[index] : 10000;
      if (isCorrect && timeSpent <= 5000) {
        currentSpeedStreak++;
        if (currentSpeedStreak > maxConsecutiveSpeed) {
          maxConsecutiveSpeed = currentSpeedStreak;
        }
      } else {
        currentSpeedStreak = 0;
      }
    });

    // TOEIC Score (ratio-based approximation)
    let listeningScore = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 495) : 0;
    let readingScore = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 495) : 0;
    let score = Math.min(listeningScore + readingScore, 990);

    // Gamification Points
    const pointsCorrect = correctCount * 2;
    const pointsCompletion = isTest ? 150 : 15;
    const pointsPerfect = correctCount === questions.length && questions.length > 0 ? 20 : 0;
    const pointsSpeed = maxConsecutiveSpeed >= 5 ? 10 : 0;
    let pointsStreak = 0;

    // Anonymous user — trả kết quả không lưu DB
    if (!user) {
      return {
        resultId: null,
        totalEarned: pointsCorrect + pointsCompletion + pointsPerfect + pointsSpeed,
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

    // Lưu kết quả thi
    const result = new this.testResultModel({
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
      },
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async handleTestNotification(savedTest: any) {
    if (savedTest.topics && savedTest.topics.length > 0) {
      this.notificationsService
        .sendNotification({
          title: 'Bài thi TOEIC mới!',
          body: `Đề thi TOEIC "${savedTest.name}" thuộc chủ đề bạn quan tâm vừa được công khai.`,
          topics: savedTest.topics,
          data: { testId: savedTest._id.toString(), type: 'toeic' },
        })
        .catch((err) => console.error('Error triggering notification:', err));
    }
  }

  private async updateUserStreak(userId: string): Promise<number> {
    const todayStr = new Date().toISOString().split('T')[0];
    let streak = await this.userStreakModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

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
