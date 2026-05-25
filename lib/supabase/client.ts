import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase'; // Assuming types will be generated later

export function createClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
