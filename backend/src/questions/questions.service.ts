import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findAll(filters?: { part?: string; difficulty?: string; status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('questions')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (filters?.part) query = query.eq('part', filters.part);
    if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return { data, total: count, page, limit };
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (!data || error) throw new NotFoundException('Question not found');
    return data;
  }

  async create(dto: CreateQuestionDto) {
    const { data, error } = await this.supabase
      .from('questions')
      .insert({
        part: dto.part,
        difficulty: dto.difficulty,
        question_text: dto.questionText,
        options: dto.options,
        correct_answer: dto.correctAnswer,
        explanation: dto.explanation,
        audio_url: dto.audioUrl,
        image_url: dto.imageUrl,
        status: dto.isActive ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const { data, error } = await this.supabase
      .from('questions')
      .update({
        ...(dto.difficulty && { difficulty: dto.difficulty }),
        ...(dto.status && { status: dto.status }),
        ...(dto.questionText && { question_text: dto.questionText }),
        ...(dto.isActive !== undefined && { status: dto.isActive ? 'active' : 'draft' }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Question not found');
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw new NotFoundException('Question not found');
    return { message: 'Question deleted successfully' };
  }
}
