// ============================================================
// HCL Oral Master — Central Type Definitions
// ============================================================

// ─── Exam Phase State Machine ────────────────────────────────
export type ExamPhase =
  | 'prep'             // 10-minute preparation room
  | 'ready_to_record'  // Transition: student confirmed ready
  | 'recording'        // 2-minute oral report recording
  | 'processing'       // Audio upload + Claude analysis
  | 'discussion'       // AI examiner interactive Q&A
  | 'completed';       // Evaluation shown

// ─── HCL Analytical Framework Notes ─────────────────────────
export interface PrepNotes {
  phenomenon: string;  // 现象 — What is observed
  causes: string;      // 原因 — Root causes
  impacts: string;     // 影响 — Consequences
  solutions: string;   // 建议与总结 — Recommendations & conclusion
}

// ─── Discussion Chat Messages ────────────────────────────────
export interface DiscussionMessage {
  role: 'examiner' | 'student';
  content: string;
  timestamp: string;
  questionIndex?: number;
}

// ─── AI Evaluation Schema (matches Claude structured output) ──
export interface VocabularyUpgrade {
  original: string;
  upgraded: string;
  idiom_flag: boolean;
  context: string;
}

export interface SyntaxError {
  error_text: string;
  correction: string;
  explanation: string;
}

export interface FluencyMetrics {
  filler_word_count: number;
  frequent_fillers: string[];
}

export interface EvaluationScores {
  content_depth: number;       // 0-20
  structure_logic: number;     // 0-20
  vocabulary_language: number; // 0-20
  total: number;               // 0-40 (content_depth + vocabulary_language)
}

export interface AIEvaluation {
  scores: EvaluationScores;
  fluency_metrics: FluencyMetrics;
  syntax_errors: SyntaxError[];
  vocabulary_upgrader: VocabularyUpgrade[];
  class_macro_tags: string[];
  examiner_feedback: string;
}

// ─── Database Row Types ───────────────────────────────────────
export interface Profile {
  id: string;
  role: 'teacher' | 'student';
  display_id: string;
  class_name: string | null;
  created_at: string;
}

export interface OralAssignment {
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
}

export interface StudentSession {
  id: string;
  student_id: string;
  assignment_id: string;
  phase: ExamPhase;
  prep_notes: PrepNotes;
  prep_started_at: string;
  oral_report_audio_url: string | null;
  oral_report_transcript: string | null;
  recording_started_at: string | null;
  recording_completed_at: string | null;
  discussion_log: DiscussionMessage[];
  ai_evaluation: AIEvaluation | null;
  total_score: number | null;
  completed_at: string | null;
}

// ─── API Request/Response Shapes ─────────────────────────────
export interface GenerateQuestionsRequest {
  transcript: string;
  assignment_prompt: string;
  session_id: string;
}

export interface GenerateQuestionsResponse {
  questions: string[];
}

export interface EvaluateRequest {
  transcript: string;
  discussion_log: DiscussionMessage[];
  session_id: string;
}

export interface EvaluateResponse {
  evaluation: AIEvaluation;
}
