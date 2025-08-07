// supabaseClient.js

// Import the Supabase client library from a CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Your project's unique Supabase URL and anon key
const supabaseUrl = 'https://ykhrbqsjadwfwyzgxvfl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraHJicXNqYWR3Znd5emd4dmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzU0MjQsImV4cCI6MjA3MDE1MTQyNH0.Xy8YZnr38Z7NMxSalBPb0DlKvbQVFfuEknRDJuYpmLU';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);