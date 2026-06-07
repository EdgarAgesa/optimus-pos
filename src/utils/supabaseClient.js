import { createClient } from '@supabase/supabase-js';

// Tills share ONE Supabase project. Credentials come from the build-time env
// (.env locally, Vercel project env in prod). Never commit the real values —
// .env is gitignored; .env.example documents the required keys.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced early so a misconfigured till fails loudly instead of silently
  // making unauthenticated requests.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing env: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env'
  );
}

// The anon key is only the transport key. RLS (see supabase/schema.sql) still
// requires an authenticated session for every table — the shared shop login
// gets wired in a later layer. persistSession keeps a till signed in across
// reloads; autoRefreshToken keeps the session alive during long shifts.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
