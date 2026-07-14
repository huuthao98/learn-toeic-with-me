import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@Injectable()
export class QuestionsService {
  constructor(@InjectModel(Question.name) private questionModel: Model<QuestionDocument>) {}

  async findAll(filters?: {
    status?: string;
    testSetId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.testSetId) {
      query.testSetId = new Types.ObjectId(filters.testSetId);
    }

    const [data, total] = await Promise.all([
      this.questionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.questionModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const data = await this.questionModel.findById(id).exec();
    if (!data) throw new NotFoundException('Question not found');
    return data;
  }

  async create(dto: CreateQuestionDto) {
    const newQuestion = new this.questionModel({
      testSetId: dto.testSetId ? new Types.ObjectId(dto.testSetId) : undefined,
      questionText: dto.questionText,
      correctAnswer: dto.correctAnswer,
      explanation: dto.explanation,
      status: dto.isActive !== false ? 'active' : 'draft',
    });
    return newQuestion.save();
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const updateData: any = {};
    if (dto.testSetId) updateData.testSetId = new Types.ObjectId(dto.testSetId);
    if (dto.status) updateData.status = dto.status;
    if (dto.questionText) updateData.questionText = dto.questionText;
    if (dto.correctAnswer) updateData.correctAnswer = dto.correctAnswer;
    if (dto.explanation !== undefined) updateData.explanation = dto.explanation;
    if (dto.part !== undefined) updateData.part = dto.part;
    if (dto.isActive !== undefined) updateData.status = dto.isActive ? 'active' : 'draft';

    const data = await this.questionModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!data) throw new NotFoundException('Question not found');
    return data;
  }

  async remove(id: string) {
    const result = await this.questionModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Question not found');
    return { message: 'Question deleted successfully' };
  }

  async upsertBulk(testSetId: string, questions: Partial<CreateQuestionDto>[]) {
    const bulkOps = questions.map((q) => {
      const updateData: any = {};

      if (q.questionNumber !== undefined) updateData.questionNumber = q.questionNumber;
      if (q.questionText !== undefined) updateData.questionText = q.questionText;
      if (q.correctAnswer) updateData.correctAnswer = q.correctAnswer;
      if (q.explanation !== undefined) updateData.explanation = q.explanation;
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
    return { message: `Upserted ${bulkOps.length} questions` };
  }
}
