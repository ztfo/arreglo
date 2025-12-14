import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (!supabase) {
  console.warn('Supabase client not initialized - database operations will fail');
}

export interface ArrangementData {
  userId: string;
  title: string;
  genre?: string;
  tempo?: number;
  lengthBars?: number;
  creativity?: number;
  sections: any[];
  rawResponse: string;
}

export async function saveArrangement(data: ArrangementData): Promise<string> {
  const { data: result, error } = await supabase
    .from('arrangements')
    .insert({
      user_id: data.userId,
      title: data.title,
      genre: data.genre,
      tempo: data.tempo,
      length_bars: data.lengthBars,
      creativity: data.creativity,
      sections: data.sections,
      raw_response: data.rawResponse
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return result.id;
}

export async function getUserArrangements(userId: string) {
  const { data, error } = await supabase
    .from('arrangements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getArrangement(id: string, userId: string) {
  const { data, error } = await supabase
    .from('arrangements')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message);
  }
  return data;
}
