import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JLPTController } from './JLPT.controller';
import { JLPTService } from './JLPT.service';
import { JLPTSet, JLPTSetSchema } from './schemas/JLPT-set.schema';
import { JLPTQuestion, JLPTQuestionSchema } from './schemas/JLPT-question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JLPTSet.name, schema: JLPTSetSchema },
      { name: JLPTQuestion.name, schema: JLPTQuestionSchema },
    ]),
  ],
  controllers: [JLPTController],
  providers: [JLPTService],
  exports: [JLPTService],
})
export class JLPTModule {}
