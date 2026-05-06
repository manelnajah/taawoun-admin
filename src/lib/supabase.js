import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ppqsnbhaarzdlkdjrzrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcXNuYmhhYXJ6ZGxrZGpyenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDUyNzQsImV4cCI6MjA4ODMyMTI3NH0._85S9Vpnwwiz2xH-lP1Ffc90Y2J1orYi6zXDKaIJjMY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);