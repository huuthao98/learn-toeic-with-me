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
      query.test_set_id = new Types.ObjectId(filters.testSetId);
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
      test_set_id: dto.testSetId ? new Types.ObjectId(dto.testSetId) : undefined,
      question_text: dto.questionText,
      correct_answer: dto.correctAnswer,
      explanation: dto.explanation,
      status: dto.isActive !== false ? 'active' : 'draft',
      category: dto.category,
    });
    return newQuestion.save();
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const updateData: any = {};
    if (dto.testSetId) updateData.test_set_id = new Types.ObjectId(dto.testSetId);
    if (dto.status) updateData.status = dto.status;
    if (dto.correctAnswer) updateData.correct_answer = dto.correctAnswer;
    if (dto.explanation !== undefined) updateData.explanation = dto.explanation;
    if (dto.category !== undefined) updateData.category = dto.category;
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

      if (q.questionNumber !== undefined) updateData.question_number = q.questionNumber;
      if (q.questionText !== undefined) updateData.question_text = q.questionText;
      if (q.correctAnswer) updateData.correct_answer = q.correctAnswer;
      if (q.explanation !== undefined) updateData.explanation = q.explanation;
      if (q.isActive !== undefined) updateData.status = q.isActive ? 'active' : 'draft';

      return {
        updateOne: {
          filter: {
            test_set_id: new Types.ObjectId(testSetId),
            question_number: q.questionNumber,
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
