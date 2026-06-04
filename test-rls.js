const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // We need to login as Sathvik to test the RLS policies just like the browser does
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'sathvik@zyxen.in',
    password: 'password123' // assuming standard test password
  });

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*, department:departments!users_department_id_fkey(*)')
    .eq('id', authData.user.id)
    .single();

  console.log('Error:', error);
  console.log('Data:', data);
}

test();
