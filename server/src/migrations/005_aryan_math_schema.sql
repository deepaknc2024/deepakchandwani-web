CREATE SCHEMA IF NOT EXISTS aryan;

CREATE TABLE IF NOT EXISTS aryan.questions (
  id SERIAL PRIMARY KEY,
  question_key VARCHAR(100) UNIQUE NOT NULL,
  grade INTEGER NOT NULL DEFAULT 3,
  topic VARCHAR(80) NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 2,
  question_text TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aryan_questions_topic ON aryan.questions(topic);
CREATE INDEX IF NOT EXISTS idx_aryan_questions_grade ON aryan.questions(grade);

CREATE TABLE IF NOT EXISTS aryan.sessions (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(80) NOT NULL DEFAULT 'Aryan',
  topic_filter VARCHAR(80),
  target_questions INTEGER NOT NULL DEFAULT 10,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_aryan_sessions_started ON aryan.sessions(started_at DESC);

CREATE TABLE IF NOT EXISTS aryan.answers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES aryan.sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES aryan.questions(id),
  selected_index INTEGER,
  is_correct BOOLEAN NOT NULL,
  time_seconds NUMERIC(8,2) NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aryan_answers_session ON aryan.answers(session_id);
CREATE INDEX IF NOT EXISTS idx_aryan_answers_question ON aryan.answers(question_id);
