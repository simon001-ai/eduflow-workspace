import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .limit(1);

  console.log('DATA:', data);
  console.log('ERROR:', error);
}

test();