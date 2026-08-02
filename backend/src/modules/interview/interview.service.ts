import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InterviewSet, InterviewSetDocument } from './schemas/interview-set.schema';
import { TestResult, TestResultDocument } from '../dashboard/schemas/test-result.schema';
import { InterviewQuestion, InterviewQuestionDocument } from './schemas/interview-question.schema';
import { CreateInterviewQuestionDto } from './dto/interview-question.dto';
import { CreateInterviewSetDto } from './dto/create-interview-set.dto';
import { UpdateInterviewSetDto } from './dto/update-interview-set.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InterviewService {
  constructor(
    @InjectModel(InterviewSet.name) private interviewSetModel: Model<InterviewSetDocument>,
    @InjectModel(TestResult.name) private TestResultModel: Model<TestResultDocument>,
    @InjectModel(InterviewQuestion.name) private questionModel: Model<InterviewQuestionDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getQuestions(testSetId: string, skip = 0, limit = 0) {
    let query = this.questionModel.find({ testSetId: new Types.ObjectId(testSetId) }).sort({ questionNumber: 1 });
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    return query.exec();
  }

  async upsertBulkQuestions(testSetId: string, questions: Partial<CreateInterviewQuestionDto & { questionNumber: number }>[]) {
    const bulkOps = questions.map((q) => {
      const updateData: any = {};
      if (q.questionNumber !== undefined) updateData.questionNumber = q.questionNumber;
      if (q.questionText !== undefined) updateData.questionText = q.questionText;
      if (q.explanation !== undefined) updateData.explanation = q.explanation;
      if (q.isActive !== undefined) updateData.status = q.isActive ? 'active' : 'draft';
      if (q.correctAnswer !== undefined) updateData.correctAnswer = q.correctAnswer;

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

  async createQuestion(dto: CreateInterviewQuestionDto) {
    const newQuestion = new this.questionModel(dto);
    return newQuestion.save();
  }

  async updateQuestion(id: string, dto: Partial<CreateInterviewQuestionDto>) {
    const updated = await this.questionModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Question not found');
    return updated;
  }

  async deleteQuestion(id: string) {
    const deleted = await this.questionModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Question not found');
    return { message: 'Question deleted' };
  }

  async findAll(status?: string) {
    const query: any = {};
    if (status) query.status = status;
    const matchStage = { $match: query };

    return this.interviewSetModel.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'interviewquestions',
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
    const interviewSet = await this.interviewSetModel.findById(id).exec();
    if (!interviewSet) {
      throw new NotFoundException('Interview set not found');
    }
    return interviewSet;
  }

  async create(dto: CreateInterviewSetDto) {
    const existingTest = await this.interviewSetModel.findOne({ name: dto.name }).exec();
    if (existingTest) {
      throw new BadRequestException('Tên chủ đề đã tồn tại. Vui lòng chọn tên khác.');
    }

    const newInterviewSet = new this.interviewSetModel({
      name: dto.name,
      description: dto.description,
      status: dto.status || 'draft',
      topics: dto.topics || [],
      accessLevel: dto.accessLevel || 'external',
    });
    
    const savedTest = await newInterviewSet.save();

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
    const interviewSet = await this.interviewSetModel.findById(testSetId).exec();
    if (!interviewSet) {
      throw new NotFoundException('Interview set not found');
    }

    // Save test result without score/streak for interview
    const result = new this.TestResultModel({
      userId: new Types.ObjectId(userId),
      testType: 'InterviewSet',
      testSetId: new Types.ObjectId(testSetId),
      score: 0,
      listeningScore: 0,
      readingScore: 0,
      durationMinutes: durationMinutes || 0,
      status: 'completed',
      answers,
    });

    await result.save();

    return {
      resultId: result._id,
    };
  }

  async update(id: string, dto: UpdateInterviewSetDto) {
    const interviewSet = await this.findOne(id);
    const wasDraft = interviewSet.status !== 'public';
    
    if (dto.name !== undefined) interviewSet.name = dto.name;
    if (dto.description !== undefined) interviewSet.description = dto.description;
    if (dto.correctAnswer !== undefined) interviewSet.correctAnswer = dto.correctAnswer;
    if (dto.status !== undefined) interviewSet.status = dto.status;
    if (dto.topics !== undefined) interviewSet.topics = dto.topics;
    if (dto.accessLevel !== undefined) interviewSet.accessLevel = dto.accessLevel;

    const savedTest = await interviewSet.save();

    if (dto.notifyUsers && wasDraft && savedTest.status === 'public') {
      await this.handleTestNotification(savedTest as any);
    }

    return savedTest;
  }

  async delete(id: string) {
    const interviewSet = await this.interviewSetModel.findById(id).exec();
    if (!interviewSet) {
      throw new NotFoundException('Interview set not found');
    }

    // Cascading delete questions belonging to this test set
    await this.questionModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();

    // Cascading delete test results belonging to this test set
    await this.TestResultModel.deleteMany({ testSetId: new Types.ObjectId(id) }).exec();

    // Delete the test set itself
    await this.interviewSetModel.findByIdAndDelete(id).exec();

    return { message: 'Interview set and all associated questions/results deleted successfully' };
  }

  private async handleTestNotification(savedTest: any) {
    if (savedTest.topics && savedTest.topics.length > 0) {
      this.notificationsService.sendNotification({
        title: 'Chủ đề phỏng vấn mới!',
        body: `Chủ đề phỏng vấn "${savedTest.name}" thuộc chủ đề bạn quan tâm vừa được công khai.`,
        topics: savedTest.topics,
        data: { testId: savedTest._id.toString(), type: 'interview' },
      }).catch(err => console.error('Error triggering notification:', err));
    }
  }
}
