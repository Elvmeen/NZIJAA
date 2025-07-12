
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
let supabaseAdmin = null;

if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase configured successfully');
  
  // Client for frontend operations
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Admin client for backend operations (if service key is available)
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase admin client configured');
  } else {
    console.warn('⚠️ Supabase service key not configured - admin operations unavailable');
  }
} else {
  console.warn('⚠️ Supabase credentials not configured - running in demo mode');
  console.warn('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
}

module.exports = { supabase, supabaseAdmin };
