-- =============================================================================
-- ADD MESSAGE DELETION TRACKING COLUMNS
-- =============================================================================

-- Add deletion columns to chat_messages
ALTER TABLE chat_messages
ADD COLUMN deleted_for_sender BOOLEAN DEFAULT false,
ADD COLUMN deleted_for_recipient BOOLEAN DEFAULT false;

-- Create index for efficient filtering of active messages
CREATE INDEX idx_chat_messages_active ON chat_messages(
  sender_id,
  recipient_id,
  deleted_for_sender,
  deleted_for_recipient
);

-- Add comment for clarity
COMMENT ON COLUMN chat_messages.deleted_for_sender IS 'True if message is deleted for sender only';
COMMENT ON COLUMN chat_messages.deleted_for_recipient IS 'True if message is deleted for both parties';
