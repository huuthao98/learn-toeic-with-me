import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const { data, count } = await this.supabase
      .from('users')
      .select('id, email, full_name, role, plan, created_at', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });
    return { data, total: count, page, limit };
  }

  async findOne(id: string) {
    const { data } = await this.supabase
      .from('users')
      .select('id, email, full_name, role, plan, target_score, created_at')
      .eq('id', id)
      .single();
    return data;
  }
}
