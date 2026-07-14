import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic } from './schemas/topic.schema';
import { CreateTopicDto, UpdateTopicDto } from './dto/topics.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
  ) {}

  async findAll(activeOnly = false): Promise<Topic[]> {
    const query = activeOnly ? { isActive: true } : {};
    return this.topicModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicModel.findById(id).exec();
    if (!topic) {
      throw new NotFoundException(`Topic #${id} not found`);
    }
    return topic;
  }

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    const existing = await this.topicModel.findOne({ code: createTopicDto.code }).exec();
    if (existing) {
      throw new ConflictException(`Topic with code '${createTopicDto.code}' already exists`);
    }
    const createdTopic = new this.topicModel(createTopicDto);
    return createdTopic.save();
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    if (updateTopicDto.code) {
      const existing = await this.topicModel.findOne({ code: updateTopicDto.code, _id: { $ne: id } }).exec();
      if (existing) {
        throw new ConflictException(`Topic with code '${updateTopicDto.code}' already exists`);
      }
    }
    const updatedTopic = await this.topicModel
      .findByIdAndUpdate(id, updateTopicDto, { new: true })
      .exec();
    if (!updatedTopic) {
      throw new NotFoundException(`Topic #${id} not found`);
    }
    return updatedTopic;
  }

  async remove(id: string): Promise<Topic> {
    const deletedTopic = await this.topicModel.findByIdAndDelete(id).exec();
    if (!deletedTopic) {
      throw new NotFoundException(`Topic #${id} not found`);
    }
    return deletedTopic;
  }
}
