-- ============================================================
-- HCL Oral Master — Complete Supabase DDL
-- Run in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES  (decoupled from auth.users for PDPA compliance)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE profiles (
    id          UUID        REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
    display_id  VARCHAR(50) NOT NULL,   -- "SEC2_HCL_01" or teacher initials — NO real names
    class_name  VARCHAR(20),            -- "2A", "2B" — NULL for teachers
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. ORAL ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE oral_assignments (
    id                   UUID         DEFAULT uuid_generate_v4() PRIMARY KEY,
    title                VARCHAR(200) NOT NULL,
    video_url            TEXT         NOT NULL,
    stimulus_description TEXT         NOT NULL,   -- Textual description shown in prep room
    prompt_text          TEXT         NOT NULL,   -- Critical-thinking prompt
    teacher_id           UUID         REFERENCES profiles(id) ON DELETE SET NULL,
    class_targets        TEXT[]       DEFAULT '{}',  -- ["2A", "2B"]
    due_date             TIMESTAMPTZ,
    is_active            BOOLEAN      DEFAULT TRUE,
    created_at           TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. STUDENT SESSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE student_sessions (
    id                        UUID         DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id                UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assignment_id             UUID         NOT NULL REFERENCES oral_assignments(id) ON DELETE CASCADE,
    phase                     VARCHAR(20)  NOT NULL DEFAULT 'prep'
                                           CHECK (phase IN ('prep','ready_to_record','recording','processing','discussion','completed')),
    -- Prep notes (HCL framework)
    prep_notes                JSONB        DEFAULT '{"phenomenon":"","causes":"","impacts":"","solutions":""}',
    prep_started_at           TIMESTAMPTZ  DEFAULT NOW(),
    -- Oral report
    oral_report_audio_url     TEXT,
    oral_report_transcript    TEXT,
    recording_started_at      TIMESTAMPTZ,
    recording_completed_at    TIMESTAMPTZ,
    -- Discussion
    discussion_log            JSONB        DEFAULT '[]',
    -- AI evaluation (matches AIEvaluation TypeScript interface)
    ai_evaluation             JSONB,
    total_score               SMALLINT     CHECK (total_score BETWEEN 0 AND 40),
    completed_at              TIMESTAMPTZ,
    UNIQUE (student_id, assignment_id)
);

-- ─────────────────────────────────────────────────────────────
-- Performance indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_sessions_student      ON student_sessions (student_id);
CREATE INDEX idx_sessions_assignment   ON student_sessions (assignment_id);
CREATE INDEX idx_sessions_phase        ON student_sessions (phase);
CREATE INDEX idx_assignments_teacher   ON oral_assignments (teacher_id);
CREATE INDEX idx_assignments_active    ON oral_assignments (is_active, due_date DESC);

-- ─────────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE oral_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_sessions  ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "own_profile_select"  ON profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "own_profile_update"  ON profiles FOR UPDATE  USING (auth.uid() = id);
CREATE POLICY "own_profile_insert"  ON profiles FOR INSERT  WITH CHECK (auth.uid() = id);

-- Assignments: teachers manage their own; students read active ones in their class
CREATE POLICY "teacher_manage_assignments" ON oral_assignments FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
        AND teacher_id = auth.uid()
    );

CREATE POLICY "student_read_assignments" ON oral_assignments FOR SELECT
    USING (
        is_active = TRUE
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'student'
              AND class_name = ANY(class_targets)
        )
    );

-- Sessions: students own; teachers read sessions for their assignments
CREATE POLICY "student_own_sessions" ON student_sessions FOR ALL
    USING (student_id = auth.uid());

CREATE POLICY "teacher_read_sessions" ON student_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM oral_assignments oa
            JOIN  profiles p ON p.id = auth.uid()
            WHERE oa.id = student_sessions.assignment_id
              AND oa.teacher_id = auth.uid()
              AND p.role = 'teacher'
        )
    );

-- ─────────────────────────────────────────────────────────────
-- Supabase Storage: create bucket via dashboard or CLI
-- supabase storage create oral-recordings --public false
-- ─────────────────────────────────────────────────────────────
