CREATE TABLE IF NOT EXISTS meeting_note_tts_plays (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL REFERENCES meeting_notes(id) ON DELETE CASCADE,
  prompt_id INTEGER REFERENCES meeting_note_prompts(id) ON DELETE CASCADE,
  lang_code VARCHAR(20) NOT NULL,
  lang_label VARCHAR(60) NOT NULL,
  cost_total_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  cost_translation_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  cost_tts_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  translation_model VARCHAR(120),
  tts_provider VARCHAR(120),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  tts_chars INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tts_plays_prompt ON meeting_note_tts_plays(prompt_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tts_plays_note ON meeting_note_tts_plays(note_id, created_at);
