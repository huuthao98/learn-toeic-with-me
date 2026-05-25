import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  async findAll(filters?: {
    part?: string;
    difficulty?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters?.part) query.part = filters.part;
    if (filters?.difficulty) query.difficulty = filters.difficulty;
    if (filters?.status) query.status = filters.status;

    const [data, total] = await Promise.all([
      this.questionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
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
      part: dto.part,
      difficulty: dto.difficulty,
      question_text: dto.questionText,
      options: dto.options,
      correct_answer: dto.correctAnswer,
      explanation: dto.explanation,
      audio_url: dto.audioUrl,
      image_url: dto.imageUrl,
      status: dto.isActive !== false ? 'active' : 'draft',
    });
    return newQuestion.save();
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const updateData: any = {};
    if (dto.difficulty) updateData.difficulty = dto.difficulty;
    if (dto.status) updateData.status = dto.status;
    if (dto.questionText) updateData.question_text = dto.questionText;
    if (dto.isActive !== undefined)
      updateData.status = dto.isActive ? 'active' : 'draft';

    const data = await this.questionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!data) throw new NotFoundException('Question not found');
    return data;
  }

  async remove(id: string) {
    const result = await this.questionModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Question not found');
    return { message: 'Question deleted successfully' };
  }
}
