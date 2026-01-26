const SUPABASE_URL = "https://ssziasopmhpszlztmbio.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzemlhc29wbWhwc3psenRtYmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDk0MDksImV4cCI6MjA4NTAyNTQwOX0.FqoNDC-XeWbgG-jkns6rk5z2_-OpWuefQ5esQid0FK8";

// ⚠️ NÃO redeclare "supabase"
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Expor um alias seguro
window.db = supabaseClient;

const CONFIG = {
  SENHA_ADMIN: "admin123"
};
