'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  filters?: { column: string; value: string | number | boolean | null }[];
  order?: { column: string; ascending?: boolean };
  limit?: number;
  enabled?: boolean;
  queryKey?: string[];
}

export function useSupabaseQuery<T = Record<string, unknown>>(
  options: UseSupabaseQueryOptions
): UseQueryResult<T[], Error> {
  const { table, select = '*', filters = [], order, limit, enabled = true, queryKey } = options;
  return useQuery<T[], Error>({
    queryKey: queryKey ?? [table, select, JSON.stringify(filters), order?.column, order?.ascending, limit],
    enabled,
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase.from(table).select(select);
      for (const f of filters) {
        query = query.eq(f.column, f.value as never);
      }
      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? false });
      }
      if (limit) {
        query = query.limit(limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as T[]) ?? [];
    },
  });
}
