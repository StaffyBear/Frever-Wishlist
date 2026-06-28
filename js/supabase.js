import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const SUPABASE_URL = "https://fpavwooqhubikdnlhjvw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwYXZ3b29xaHViaWtkbmxoanZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzQ5NDIsImV4cCI6MjA5ODIxMDk0Mn0.vYxCddWQAeMcMZwEegMi-4m83JGTNI8eteMt8VSARV8";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
