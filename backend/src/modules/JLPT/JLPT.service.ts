import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JLPTSet, JLPTSetDocument } from './schemas/JLPT-set.schema';
import { JLPTQuestion, JLPTQuestionDocument } from './schemas/JLPT-question.schema';

@Injectable()
export class JLPTService {
  constructor(
    @InjectModel(JLPTSet.name) private jlptSetModel: Model<JLPTSetDocument>,
    @InjectModel(JLPTQuestion.name) private JLPTQuestionModel: Model<JLPTQuestionDocument>,
  ) {}

  async findAllSets(query: any = {}): Promise<JLPTSet[]> {
    return this.jlptSetModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findSetById(id: string): Promise<JLPTSet> {
    const set = await this.jlptSetModel.findById(id).exec();
    if (!set) {
      throw new NotFoundException(`JLPTSet with ID ${id} not found`);
    }
    return set;
  }

  async createSet(createData: any): Promise<JLPTSet> {
    const createdSet = new this.jlptSetModel(createData);
    return createdSet.save();
  }

  async updateSet(id: string, updateData: any): Promise<JLPTSet> {
    const updatedSet = await this.jlptSetModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedSet) {
      throw new NotFoundException(`JLPTSet with ID ${id} not found`);
    }
    return updatedSet;
  }

  async deleteSet(id: string): Promise<any> {
    const deletedSet = await this.jlptSetModel.findByIdAndDelete(id).exec();
    if (!deletedSet) {
      throw new NotFoundException(`JLPTSet with ID ${id} not found`);
    }
    // Delete associated questions
    await this.JLPTQuestionModel.deleteMany({ jlptSetId: id }).exec();
    return deletedSet;
  }

  async getQuestionsBySetId(setId: string): Promise<JLPTQuestion[]> {
    return this.JLPTQuestionModel.find({ jlptSetId: setId }).sort({ questionNumber: 1 }).exec();
  }

  async createQuestion(createData: any): Promise<JLPTQuestion> {
    const createdQuestion = new this.JLPTQuestionModel(createData);
    return createdQuestion.save();
  }

  async upsertBulkQuestions(setId: string, questions: any[]) {
    const bulkOps = questions.map((q) => {
      const updateData: any = {};
      if (q.section !== undefined) updateData.section = q.section;
      if (q.part !== undefined) updateData.part = q.part;
      if (q.questionNumber !== undefined) updateData.questionNumber = q.questionNumber;
      if (q.questionType !== undefined) updateData.questionType = q.questionType;
      if (q.options !== undefined) updateData.options = q.options;
      if (q.questionText !== undefined) updateData.questionText = q.questionText;
      if (q.correctAnswer !== undefined) updateData.correctAnswer = q.correctAnswer;
      if (q.explanation !== undefined) updateData.explanation = q.explanation;
      if (q.passageContext !== undefined) updateData.passageContext = q.passageContext;
      if (q.passageType !== undefined) updateData.passageType = q.passageType;
      if (q.audioUrl !== undefined) updateData.audioUrl = q.audioUrl;
      if (q.imageUrl !== undefined) updateData.imageUrl = q.imageUrl;
      
      if (q.status !== undefined) {
        updateData.status = q.status;
      } else if (q.isActive !== undefined) {
        updateData.status = q.isActive ? 'active' : 'draft';
      }

      const filter: any = { jlptSetId: new Types.ObjectId(setId) };
      
      if (q.questionNumber) {
        filter.questionNumber = q.questionNumber;
        if (q.section) filter.section = q.section;
        if (q.part) filter.part = q.part;
      } else if (q.section && q.part) {
        filter.section = q.section;
        filter.part = q.part;
      }
 
      return {
        updateOne: {
          filter,
          update: { $set: updateData },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      await this.JLPTQuestionModel.bulkWrite(bulkOps);
    }
    return { message: 'Questions updated successfully' };
  }
}
