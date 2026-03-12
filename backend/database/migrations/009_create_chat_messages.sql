-- =============================================================================
-- CHAT MESSAGES TABLE - for direct messaging between students and lecturers
-- =============================================================================

-- Create the chat_messages table
CREATE TABLE chat_messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id         UUID NOT NULL,
  sender_role       TEXT NOT NULL CHECK (sender_role IN ('student', 'lecturer')),
  recipient_id      UUID NOT NULL,
  recipient_role    TEXT NOT NULL CHECK (recipient_role IN ('student', 'lecturer')),
  content           TEXT NOT NULL,
  message_type      TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document')),
  file_path         TEXT,
  file_name         TEXT,
  file_size         INTEGER,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_chat_messages_room ON chat_messages(
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id)
);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id, created_at DESC);
CREATE INDEX idx_chat_messages_recipient ON chat_messages(recipient_id, is_read);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_unread ON chat_messages(recipient_id, is_read) WHERE is_read = false;
