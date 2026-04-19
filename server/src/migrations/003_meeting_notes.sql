CREATE TABLE IF NOT EXISTS meeting_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled Meeting',
  transcript TEXT NOT NULL DEFAULT '',
  audio_filename VARCHAR(255),
  audio_duration_seconds INTEGER,
  stt_provider VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_notes_user_created
  ON meeting_notes(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS meeting_note_images (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL REFERENCES meeting_notes(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_note_images_note
  ON meeting_note_images(note_id, sort_order);

CREATE TABLE IF NOT EXISTS meeting_note_prompts (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL REFERENCES meeting_notes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_note_prompts_note
  ON meeting_note_prompts(note_id, created_at DESC);
