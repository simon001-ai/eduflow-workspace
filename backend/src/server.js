import './config/env.js';
import { supabase } from './config/supabaseClient.js';
import app from './app.js';
import { env } from './config/env.js';

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  if (supabase) {
    console.log('Supabase connected');
  } else {
    console.log('Supabase not configured — add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env');
  }
});
