'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey);

  client.auth.getSession().then(({ data }) => {
    console.log("SESSION:", data.session);
  });

  return client;
}