import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      try {
        const [_, tokenPart] = cookie.name.split('-auth-token');
        if (!tokenPart) {
          const session = JSON.parse(cookie.value);
          if (session?.access_token) {
            client.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token ?? '',
            });
          }
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  return client;
}
