
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avwdsgyvbvqxrohacvcq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2d2RzZ3l2YnZxeHJvaGFjdmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2OTkyMTMsImV4cCI6MjA2NzI3NTIxM30.F4MapgSz5MlH1Ye9uNndZQGTy0b5oVzXb4co5H-XzoI";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2d2RzZ3l2YnZxeHJvaGFjdmNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY5OTIxMywiZXhwIjoyMDY3Mjc1MjEzfQ.yxOoaUnLsHgTM0XXCrM-DA7254MvDFMu95oCnZqVgt8";

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
