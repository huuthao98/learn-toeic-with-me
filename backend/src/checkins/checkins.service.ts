import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CheckIn, CheckInDocument } from './schemas/checkin.schema';

@Injectable()
export class CheckInsService {
  constructor(
    @InjectModel(CheckIn.name) private CheckInModel: Model<CheckInDocument>,
  ) {}

  async create(userId: string, createCheckInDto: any): Promise<CheckIn> {
    const createdCheckIn = new this.CheckInModel({
      ...createCheckInDto,
      userId: new Types.ObjectId(userId),
      planId: createCheckInDto.planId
        ? new Types.ObjectId(createCheckInDto.planId)
        : undefined,
    });
    return createdCheckIn.save();
  }

  async findAllByUser(userId: string): Promise<CheckIn[]> {
    return this.CheckInModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async findOne(id: string): Promise<CheckIn | null> {
    return this.CheckInModel.findById(id).exec();
  }
}
