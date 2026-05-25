import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Plan, PlanDocument } from './schemas/plan.schema';

@Injectable()
export class PlansService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  async create(userId: string, createPlanDto: any): Promise<Plan> {
    const createdPlan = new this.planModel({
      ...createPlanDto,
      userId: new Types.ObjectId(userId),
    });
    return createdPlan.save();
  }

  async findAllByUser(userId: string): Promise<Plan[]> {
    return this.planModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findOne(id: string): Promise<Plan | null> {
    return this.planModel.findById(id).exec();
  }

  async update(id: string, updatePlanDto: any): Promise<Plan | null> {
    return this.planModel
      .findByIdAndUpdate(id, updatePlanDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Plan | null> {
    return this.planModel.findByIdAndDelete(id).exec();
  }
}
