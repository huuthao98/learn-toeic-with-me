import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestSet, TestSetDocument } from './schemas/test-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { Question, QuestionDocument } from '../questions/schemas/question.schema';
import { UserStreak, UserStreakDocument } from '../dashboard/schemas/user-streak.schema';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(TestSet.name) private testSetModel: Model<TestSetDocument>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResultDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(testType?: string, status?: string) {
    const query: any = {};
    if (testType) query.testType = testType;
    if (status) query.status = status;
    const matchStage = { $match: query };

    return this.testSetModel.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'questions',
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
    const testSet = await this.testSetModel.findById(id).exec();
    if (!testSet) {
      throw new NotFoundException('Test set not found');
    }
    return testSet;
  }

  async create(dto: {
    name: string;
    description?: string;
    audioUrl?: string;
    status?: string;
    readingPdfUrl?: string;
    listeningPdfUrl?:string;
    testType?: string;
    topics?: string[];
    notifyUsers?: boolean;
  }) {
    const existingTest = await this.testSetModel.findOne({ name: dto.name }).exec();
    if (existingTest) {
      throw new BadRequestException('Tên đề thi đã tồn tại. Vui lòng chọn tên khác.');
    }

    let newTestSet: any;
    if (dto.testType === 'toeic') {
      newTestSet = new this.testSetModel({
        name: dto.name,
        description: dto.description,
        audioUrl: dto.audioUrl,
        status: dto.status || 'draft',
        readingPdfUrl: dto.readingPdfUrl,
        listeningPdfUrl: dto.listeningPdfUrl,
        testType: dto.testType,
        topics: dto.topics || [],
      });
    } else if(dto.testType === 'interview') {
      newTestSet = new this.testSetModel({
        name: dto.name,
        description: dto.description,
        status: dto.status || 'draft',
        testType: dto.testType,
        topics: dto.topics || [],
      });
    } else {
      throw new BadRequestException('testType is required and must be either "toeic" or "interview"');
    }
    
    const savedTest = await newTestSet.save();

    if (dto.notifyUsers && savedTest.status === 'public' && savedTest.topics && savedTest.topics.length > 0) {
      if(dto.testType === 'toeic'){
        this.notificationsService.sendNotification({
        title: 'Bài thi TOEIC mới!',
        body: `Đề thi TOEIC "${savedTest.name}" thuộc chủ đề bạn quan tâm vừa được công khai.`,
        topics: savedTest.topics,
        data: { testId: savedTest._id.toString(), type: savedTest.testType },
      }).catch(err => console.error('Error triggering notification on test create:', err));
      }else if(dto.testType === 'interview'){
        this.notificationsService.sendNotification({
        title: 'Chủ đề phỏng vấn mới!',
        body: `Chủ đề phỏng vấn "${savedTest.name}" thuộc chủ đề bạn quan tâm vừa được công khai.`,
        topics: savedTest.topics,
        data: { testId: savedTest._id.toString(), type: savedTest.testType },
      }).catch(err => console.error('Error triggering notification on test create:', err));
      }
    }

    return savedTest;
  }

  async findQuestions(testSetId: string) {
    return this.questionModel
      .find({ testSetId: new Types.ObjectId(testSetId) })
      .sort({ part: 1, createdAt: 1 })
      .exec();
  }

  async findResult(resultId: string) {
    const result = await this.testResultModel
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
    const testSet = await this.testSetModel.findById(testSetId).exec();
    if (!testSet) {
      throw new NotFoundException('Test set not found');
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
      const part = q.part || '';
      const isListening = ['1', '2', '3', '4'].includes(part);
      const isReading = ['5', '6', '7'].includes(part);

      if (isListening) {
        listeningTotal++;
      } else if (isReading) {
        readingTotal++;
      } else {
        // Fallback if part is undefined or unexpected, though normally it shouldn't happen.
        // If it happens, we assume it's reading for total count so at least we don't divide by 0 if all are undefined?
        // Let's just track it as reading for safety or ignore.
      }

      const userAnswer = answers[q._id.toString()];
      if (userAnswer && userAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase()) {
        correctCount++;
        if (isListening) {
          listeningCorrect++;
        } else if (isReading) {
          readingCorrect++;
        }
      }
    });

    // Calculate score scaled to 495 max for each section
    const listeningScore =
      listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 495) : 0;
    const readingScore = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 495) : 0;

    // Calculate total score
    let score = listeningScore + readingScore;
    if (score > 990) score = 990;

    // Save test result
    const result = new this.testResultModel({
      userId: new Types.ObjectId(userId),
      testSetId: new Types.ObjectId(testSetId),
      score,
      listeningScore: listeningScore,
      readingScore: readingScore,
      durationMinutes: durationMinutes || 0,
      status: 'completed',
      answers,
    });

    await result.save();

    // Update user study streak
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

    return {
      resultId: result._id,
      score,
      listeningScore,
      readingScore,
      correctCount,
      totalQuestions: questions.length,
      currentStreak: streak.currentStreak,
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
      testType?: string;
    },
  ) {
    const testSet = await this.findOne(id);
    const wasDraft = testSet.status !== 'public';
    
    if (dto.name !== undefined) testSet.name = dto.name;
    if (dto.description !== undefined) testSet.description = dto.description;
    if (dto.audioUrl !== undefined) testSet.audioUrl = dto.audioUrl;
    if (dto.status !== undefined) testSet.status = dto.status;
    if (dto.readingPdfUrl !== undefined) testSet.readingPdfUrl = dto.readingPdfUrl;
    if (dto.listeningPdfUrl !== undefined) testSet.listeningPdfUrl = dto.listeningPdfUrl;
    if (dto.topics !== undefined) testSet.topics = dto.topics;
    
    const savedTest = await testSet.save();

    if (dto.notifyUsers && wasDraft && savedTest.status === 'public' && savedTest.topics && savedTest.topics.length > 0) {
      if(dto.testType === 'toeic'){
        this.notificationsService.sendNotification({
          title: 'Bài thi TOEIC mới!',
          body: `Đề thi TOEIC "${savedTest.name}" thuộc chủ đề bạn quan tâm vừa được công khai.`,
          topics: savedTest.topics,
          data: { testId: savedTest._id.toString(), type: savedTest.testType },
        }).catch(err => console.error('Error triggering notification on test update:', err));
      }else if(dto.testType === 'interview'){
        this.notificationsService.sendNotification({
        title: 'Chủ đề phỏng vấn mới!',
        body: `Chủ đề phỏng vấn "${savedTest.name}" thuộc chủ đề bạn quan tâm vừa được công khai.`,
        topics: savedTest.topics,
        data: { testId: savedTest._id.toString(), type: savedTest.testType },
      }).catch(err => console.error('Error triggering notification on test update:', err));
      }
    }

    return savedTest;
  }

  async delete(id: string) {
    const testSet = await this.testSetModel.findById(id).exec();
    if (!testSet) {
      throw new NotFoundException('Test set not found');
    }

    // Cascading delete questions belonging to this test set
    await this.questionModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();

    // Cascading delete test results belonging to this test set
    await this.testResultModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();

    // Delete the test set itself
    await this.testSetModel.findByIdAndDelete(id).exec();

    return { message: 'Test set and all associated questions/results deleted successfully' };
  }
}
