'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';
import { ContractorSettings } from '@/lib/types';
import { revalidatePath } from 'next/cache';

async function getUser() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

export async function saveContractorSettings(payload: Partial<ContractorSettings>) {
  const { supabase, user } = await getUser();


  // Basic validation could happen here
  const { data: existing } = await supabase
    .from('contractor_settings')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  const updates = {
    ...payload,
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('contractor_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw new Error('Failed to update settings');
    result = data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('contractor_settings')
      .insert({
        ...updates,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw new Error('Failed to create settings');
    result = data;
  }

  revalidatePath('/time-clock/settings');
  revalidatePath('/time-clock');
  return result;
}

