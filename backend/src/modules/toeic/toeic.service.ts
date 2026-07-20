import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ToeicSet, ToeicSetDocument } from './schemas/toeic-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { ToeicQuestion, ToeicQuestionDocument } from './schemas/toeic-question.schema';
import { CreateToeicQuestionDto } from './dto/toeic-question.dto';
import { UserStreak, UserStreakDocument } from '../dashboard/schemas/user-streak.schema';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ToeicService {
  constructor(
    @InjectModel(ToeicSet.name) private ToeicSetModel: Model<ToeicSetDocument>,
    @InjectModel(TestResult.name) private TestResultModel: Model<TestResultDocument>,
    @InjectModel(ToeicQuestion.name) private questionModel: Model<ToeicQuestionDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getQuestions(testSetId: string, skip = 0, limit = 0) {
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

  async findAll(status?: string) {
    const query: any = {};
    if (status) query.status = status;
    const matchStage = { $match: query };

    return this.ToeicSetModel.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'toeicquestions',
          localField: '_id',
          foreignField: 'testSetId', // Note: assuming question model still uses testSetId or ToeicSetId. We should check that. Assuming foreignField is still testSetId in questions? Actually earlier rename replaced 'TestSetId' to 'ToeicSetId', but testSetId was lowercase 'testSetId'. Wait, rename script didn't touch 'testSetId', it touched 'TestSetId'. Let's keep it as testSetId.
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

  async findOne(id: string) {
    const ToeicSet = await this.ToeicSetModel.findById(id).exec();
    if (!ToeicSet) {
      throw new NotFoundException('Toeic set not found');
    }
    return ToeicSet;
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
    });
    
    const savedTest = await newToeicSet.save();

    if (dto.notifyUsers && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async findQuestions(testSetId: string) { // Keeping parameter name simple
    return this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .sort({ part: 1, createdAt: 1 })
      .exec();
  }

  async findResult(resultId: string) {
    const result = await this.TestResultModel
      .findById(resultId)
      .populate('testSetId', 'name total_questions parts_count')
      .exec();
    if (!result) {
      throw new NotFoundException('Test result not found');
    }
    return result;
  }

  async submitExam(
    userId: string,
    testSetId: string,
    answers: { [questionId: string]: string },
    durationMinutes?: number,
  ) {
    const ToeicSet = await this.ToeicSetModel.findById(testSetId).exec();
    if (!ToeicSet) {
      throw new NotFoundException('Toeic set not found');
    }

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

    questions.forEach((q) => {
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
    });

    let score = 0;
    let listeningScore = 0;
    let readingScore = 0;

    listeningScore = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 495) : 0;
    readingScore = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 495) : 0;
    score = listeningScore + readingScore;
    if (score > 990) score = 990;

    // Save test result
    const result = new this.TestResultModel({
      userId: new Types.ObjectId(userId),
      testSetId: new Types.ObjectId(testSetId),
      score,
      listeningScore,
      readingScore,
      durationMinutes: durationMinutes || 0,
      status: 'completed',
      answers,
    });

    await result.save();

    const currentStreak = await this.updateUserStreak(userId);

    return {
      resultId: result._id,
      score,
      listeningScore,
      readingScore,
      correctCount,
      totalQuestions: questions.length,
      currentStreak,
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
