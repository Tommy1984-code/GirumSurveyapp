CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visit_doctors (
  visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  PRIMARY KEY (visit_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS survey_tokens (
  token TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES visits(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0)
);

CREATE TABLE IF NOT EXISTS token_doctors (
  token TEXT NOT NULL REFERENCES survey_tokens(token) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  PRIMARY KEY (token, doctor_id)
);

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id BIGSERIAL PRIMARY KEY,
  token TEXT NOT NULL REFERENCES survey_tokens(token),
  visit_id TEXT NOT NULL REFERENCES visits(id),
  patient_id TEXT REFERENCES patients(id),
  patient_name TEXT,
  doctor_names TEXT,
  comment TEXT,
  question_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  language TEXT DEFAULT 'am',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_ratings (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES feedback_submissions(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_survey_tokens_visit_id ON survey_tokens(visit_id);
CREATE INDEX IF NOT EXISTS idx_survey_tokens_patient_id ON survey_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_visit_id ON feedback_submissions(visit_id);
CREATE INDEX IF NOT EXISTS idx_feedback_ratings_doctor_id ON feedback_ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_question_answers_gin ON feedback_submissions USING GIN (question_answers);

CREATE INDEX IF NOT EXISTS idx_encounters_created_at ON encounters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  status TEXT NOT NULL DEFAULT 'in_progress',
  survey_token TEXT,
  survey_link TEXT,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS encounter_doctors (
  encounter_id TEXT NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  PRIMARY KEY (encounter_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS admin_notification_seen (
  admin_id INTEGER PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  last_seen_submission_id BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
