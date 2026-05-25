// Auto-generate with: supabase gen types typescript --project-id YOUR_ID > src/lib/database.types.ts
// This is a minimal hand-written version for bootstrapping.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'teacher' | 'student';
          display_id: string;
          class_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: 'teacher' | 'student';
          display_id: string;
          class_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      oral_assignments: {
        Row: {
          id: string;
          title: string;
          video_url: string;
          stimulus_description: string;
          prompt_text: string;
          teacher_id: string | null;
          class_targets: string[];
          due_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['oral_assignments']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['oral_assignments']['Insert']>;
      };
      student_sessions: {
        Row: {
          id: string;
          student_id: string;
          assignment_id: string;
          phase: string;
          prep_notes: Json;
          prep_started_at: string;
          oral_report_audio_url: string | null;
          oral_report_transcript: string | null;
          recording_started_at: string | null;
          recording_completed_at: string | null;
          discussion_log: Json;
          ai_evaluation: Json | null;
          total_score: number | null;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['student_sessions']['Row'], 'id' | 'prep_started_at'> & {
          id?: string;
          prep_started_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_sessions']['Insert']>;
      };
    };
  };
}
