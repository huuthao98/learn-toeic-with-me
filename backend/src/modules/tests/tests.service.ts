import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestSet, TestSetDocument } from './schemas/test-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { Question, QuestionDocument } from '../questions/schemas/question.schema';
import { UserStreak, UserStreakDocument } from '../dashboard/schemas/user-streak.schema';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(TestSet.name) private testSetModel: Model<TestSetDocument>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResultDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(UserStreak.name) private userStreakModel: Model<UserStreakDocument>,
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
          foreignField: 'test_set_id',
          as: 'questions',
        },
      },
      {
        $addFields: {
          total_questions: { $size: '$questions' },
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
    pdfUrl?: string;
    testType?: string;
  }) {
    let newTestSet: any;
    if (dto.testType === 'toeic') {

      newTestSet = new this.testSetModel({
      name: dto.name,
      description: dto.description,
      audioUrl: dto.audioUrl,
      status: dto.status || 'draft',
      pdfUrl: dto.pdfUrl,
      testType: dto.testType
    });
    } else if(dto.testType === 'interview') {
      newTestSet = new this.testSetModel({
        name: dto.name,
        description: dto.description,
        status: dto.status || 'draft',
        testType: dto.testType,
      });
    }
    return newTestSet.save();
  }

  async findQuestions(testSetId: string) {
    return this.questionModel
      .find({ test_set_id: new Types.ObjectId(testSetId) })
      .sort({ part: 1, createdAt: 1 })
      .exec();
  }

  async findResult(resultId: string) {
    const result = await this.testResultModel
      .findById(resultId)
      .populate('test_set_id', 'name total_questions parts_count')
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
      .find({ test_set_id: new Types.ObjectId(testSetId) })
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
      if (userAnswer && userAnswer.trim().toUpperCase() === q.correct_answer.trim().toUpperCase()) {
        correctCount++;
      }
    });

    // Calculate score scaled to 495 max for each section
    const listeningScore =
      listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 495) : 0;
    const readingScore = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 495) : 0;

    // Scale or adjust to TOEIC scale (min 10, max 990)
    let score = listeningScore + readingScore;
    if (score < 10) score = 10;
    if (score > 990) score = 990;

    // Save test result
    const result = new this.testResultModel({
      user_id: new Types.ObjectId(userId),
      test_set_id: new Types.ObjectId(testSetId),
      score,
      listening_score: listeningScore,
      reading_score: readingScore,
      duration_minutes: durationMinutes || 0,
      status: 'completed',
      answers,
    });

    await result.save();

    // Update user study streak
    const todayStr = new Date().toISOString().split('T')[0];
    let streak = await this.userStreakModel.findOne({ user_id: new Types.ObjectId(userId) }).exec();

    if (!streak) {
      streak = new this.userStreakModel({
        user_id: new Types.ObjectId(userId),
        current_streak: 1,
        longest_streak: 1,
        last_study_date: new Date(todayStr),
      });
    } else {
      const lastStudyStr = streak.last_study_date
        ? new Date(streak.last_study_date).toISOString().split('T')[0]
        : null;

      if (lastStudyStr !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastStudyStr === yesterdayStr) {
          streak.current_streak += 1;
        } else {
          streak.current_streak = 1;
        }

        if (streak.current_streak > streak.longest_streak) {
          streak.longest_streak = streak.current_streak;
        }
        streak.last_study_date = new Date(todayStr);
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
      currentStreak: streak.current_streak,
    };
  }

  async update(
    id: string,
    dto: {
      name?: string;
      description?: string;
      audioUrl?: string;
      status?: string;
      pdfUrl?: string;
    },
  ) {
    const testSet = await this.findOne(id);
    if (dto.name !== undefined) testSet.name = dto.name;
    if (dto.description !== undefined) testSet.description = dto.description;
    if (dto.audioUrl !== undefined) testSet.audioUrl = dto.audioUrl;
    if (dto.status !== undefined) testSet.status = dto.status;
    if (dto.pdfUrl !== undefined) testSet.pdfUrl = dto.pdfUrl;
    return testSet.save();
  }

  async delete(id: string) {
    const testSet = await this.testSetModel.findById(id).exec();
    if (!testSet) {
      throw new NotFoundException('Test set not found');
    }

    // Cascading delete questions belonging to this test set
    await this.questionModel.deleteMany({ test_set_id: new Types.ObjectId(id) }).exec();

    // Cascading delete test results belonging to this test set
    await this.testResultModel.deleteMany({ test_set_id: new Types.ObjectId(id) }).exec();

    // Delete the test set itself
    await this.testSetModel.findByIdAndDelete(id).exec();

    return { message: 'Test set and all associated questions/results deleted successfully' };
  }
}
