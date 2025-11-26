// import postgres from 'postgres'

// const connectionString = process.env.DATABASE_URL!!
// const sql = postgres(connectionString)

// export default sql

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);


export const create_rls_client = (jwt: string | null) => {
  if(!jwt){
    throw 'UNAUTHORIZED_ERROR'
  }

  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const supabaseAdmin = createClient(
   process.env.SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!,
   {
     auth: { autoRefreshToken: false, persistSession: false },
   }
);