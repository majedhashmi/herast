
import { createClient } from '@supabase/supabase-js';
import { Personnel } from '../types'; // Import types if needed for table definitions

// --- IMPORTANT ---
// The user needs to create a .env file in the root of the project
// and add their Supabase URL and Anon Key.
//
// VITE_SUPABASE_URL=YOUR_SUPABASE_URL
// VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are required.");
}

// Define the database schema using TypeScript for type safety.
// This matches the table names you should create in your Supabase project.
export interface Database {
  public: {
    Tables: {
      personnel: {
        Row: Personnel; // The type of a row in the table.
        Insert: Omit<Personnel, 'id' | 'created_at'>; // The type for inserting a new row.
        Update: Partial<Omit<Personnel, 'id' | 'created_at'>>; // The type for updating a row.
      };
      // Add other tables here following the same pattern
      posts: {
        Row: any; 
        Insert: any;
        Update: any;
      };
      shifts: {
        Row: any;
        Insert: any;
        Update: any;
      };
      leave_requests: {
        Row: any;
        Insert: any;
        Update: any;
      };
      reports: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
