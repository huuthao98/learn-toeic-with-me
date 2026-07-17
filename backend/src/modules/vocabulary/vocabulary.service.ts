import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VocabularySet, VocabularySetDocument } from './schemas/vocabulary-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { VocabularyQuestion, VocabularyQuestionDocument } from './schemas/vocabulary-question.schema';
import { CreateVocabularyQuestionDto } from './dto/vocabulary-question.dto';
import { UserStreak, UserStreakDocument } from '../dashboard/schemas/user-streak.schema';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VocabularyService {
  constructor(
    @InjectModel(VocabularySet.name) private vocabularySetModel: Model<VocabularySetDocument>,
    @InjectModel(TestResult.name) private TestResultModel: Model<TestResultDocument>,
    @InjectModel(VocabularyQuestion.name) private questionModel: Model<VocabularyQuestionDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
    private readonly notificationsService: NotificationsService,
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

  async findAll(status?: string, category?: string) {
    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;
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

  async findOne(id: string) {
    const vocabularySet = await this.vocabularySetModel.findById(id).exec();
    if (!vocabularySet) {
      throw new NotFoundException('Vocabulary set not found');
    }
    return vocabularySet;
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
      category: dto.category,
      topics: dto.topics || [],
    });
    
    const savedTest = await newVocabularySet.save();

    if (dto.notifyUsers && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async findQuestions(testSetId: string, skip = 0, limit = 0) {
    let query = this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .sort({ createdAt: 1 });
      
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
    userId: string,
    testSetId: string,
    answers: { [questionId: string]: string },
    durationMinutes?: number,
  ) {
    const vocabularySet = await this.vocabularySetModel.findById(testSetId).exec();
    if (!vocabularySet) {
      throw new NotFoundException('Vocabulary set not found');
    }

    // Fetch all questions for this test set
    const questions = await this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .exec();
    if (questions.length === 0) {
      throw new NotFoundException('No questions found for this test set');
    }

    let correctCount = 0;

    questions.forEach((q) => {
      const userAnswer = answers[q._id.toString()];
      const isCorrect = userAnswer && userAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
      
      if (isCorrect) correctCount++;
    });

    let score = correctCount; // Raw score for vocabulary

    // Save test result
    const result = new this.TestResultModel({
      userId: new Types.ObjectId(userId),
      testSetId: new Types.ObjectId(testSetId),
      score,
      listeningScore: 0,
      readingScore: 0,
      durationMinutes: durationMinutes || 0,
      status: 'completed',
      answers,
    });

    await result.save();

    const currentStreak = await this.updateUserStreak(userId);

    return {
      resultId: result._id,
      score,
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
      category?: string;
      topics?: string[];
      notifyUsers?: boolean;
    },
  ) {
    const vocabularySet = await this.findOne(id);
    const wasDraft = vocabularySet.status !== 'public';
    
    if (dto.name !== undefined) vocabularySet.name = dto.name;
    if (dto.description !== undefined) vocabularySet.description = dto.description;
    if (dto.status !== undefined) vocabularySet.status = dto.status;
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
