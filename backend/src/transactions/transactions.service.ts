import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(
    userId: string,
    createTransactionDto: any,
  ): Promise<Transaction> {
    const createdTransaction = new this.transactionModel({
      ...createTransactionDto,
      userId: new Types.ObjectId(userId),
      CheckInId: new Types.ObjectId(createTransactionDto.CheckInId),
    });
    return createdTransaction.save();
  }

  async findAllByUser(userId: string): Promise<Transaction[]> {
    return this.transactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
  }
}
