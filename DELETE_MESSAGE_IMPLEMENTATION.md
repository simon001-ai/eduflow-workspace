# Message Deletion Feature - Implementation Summary

## Overview
Implemented comprehensive message deletion functionality with two deletion scopes:
- **Delete for you**: Message hidden from sender only (recipient still sees it)
- **Delete for everyone**: Message hidden from both sender and recipient

## Implementation Details

### 1. Database Changes

**File**: `/backend/database/migrations/011_add_message_deletion_tracking.sql`

Added two boolean columns to `chat_messages` table:
- `deleted_for_sender` (default: false) - Set to true when sender deletes for themselves
- `deleted_for_recipient` (default: false) - Set to true when sender deletes for everyone
- Added index `idx_chat_messages_active` for efficient filtering

Also updated `/backend/database/run_in_supabase.sql` with migration SQL that can be run directly in Supabase SQL Editor.

### 2. Backend API

**File**: `/backend/modules/chat/chat.controller.js`

New function added:
```javascript
deleteMessage(req, res, next)
```
- Accepts DELETE request with message ID in URL parameter
- Body parameter: `deletion_type` ('self' or 'everyone')
- Verifies sender ownership before allowing deletion
- Updates deletion tracking columns appropriately
- Returns success response with deletion details

**File**: `/backend/modules/chat/chat.routes.js`

New route added:
```
DELETE /message/:messageId
```
- Protected by `authMiddleware`
- Handles both deletion types

**File**: `/backend/modules/chat/chat.controller.js` - `getChatRoom()`

Updated function to filter deleted messages:
- Removes messages where `deleted_for_recipient = true` (never show)
- Removes messages where `deleted_for_sender = true` AND `sender_id = current_user` (don't show to sender if they deleted for self)

### 3. Real-time Socket Events

**File**: `/backend/src/socket.js`

New event handler:
```javascript
socket.on('chat:delete_message', async (data) => {
  // Receives: { message_id, deletion_type }
  // Updates database and emits chat:message_deleted to both parties
})
```

Updates both sender and recipient about deletion:
- Emits to sender: `{ message_id, deleted_for: 'sender' }` or `{ deleted_for: 'both' }`
- Emits to recipient: `{ deleted_for: 'both' }` only (if deleted for everyone)

### 4. Frontend - StudentChatLayout

**File**: `/frontend/src/components/student/chat/StudentChatLayout.tsx`

New state management:
```typescript
const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [deleteMode, setDeleteMode] = useState(false);
const [deleteOption, setDeleteOption] = useState<'self' | 'everyone'>('self');
const [deletingMessages, setDeletingMessages] = useState(false);
```

New event handler:
```typescript
newSocket.on("chat:message_deleted", (data) => {
  // Filters out deleted messages from local state
})
```

New UI components:
- **Delete Mode Button**: Toggle delete mode on/off
- **Message Checkboxes**: Appear when delete mode is active, select multiple messages
- **Delete Button**: Shows count of selected messages
- **Delete Dialog**: Radio buttons for "Delete for you" vs "Delete for everyone"

### 5. Frontend - LecturerChatLayout

**File**: `/frontend/src/components/lecturer/chat/LecturerChatLayout.tsx`

Identical implementation to StudentChatLayout with all delete features.

## User Workflow

1. **Enable Delete Mode**: Click "Delete" button → changes to red "Cancel" button
2. **Select Messages**: Click on own messages to select them (checkboxes appear)
3. **Delete Selected**: Click "Delete (n)" button showing count
4. **Choose Scope**: Dialog appears with two options:
   - ✅ Delete for you (only sender sees deletion)
   - ✅ Delete for everyone (both see deletion)
5. **Confirm**: Click "Delete" to execute
6. **Real-time Update**: Message disappears from view based on deletion scope

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Backend API endpoint responds correctly to DELETE requests
- [ ] Socket event handlers emit proper notifications
- [ ] StudentChatLayout: Delete mode toggle works
- [ ] StudentChatLayout: Message selection works (checkboxes)
- [ ] StudentChatLayout: Delete for you - hides from sender, shows to recipient
- [ ] StudentChatLayout: Delete for everyone - hides from both
- [ ] LecturerChatLayout: All above functionality works
- [ ] Cross-user deletion visibility is correct
- [ ] Socket real-time updates work
- [ ] Error handling for unauthorized deletions
- [ ] UI shows loading state during deletion
- [ ] Toast notifications for success/error

## Architecture Decisions

1. **Database Columns vs Table**: Used boolean columns on chat_messages table instead of separate deletion tracking table for simplicity and performance

2. **Sender-only Deletion**: Only message sender can delete messages (recipients cannot delete others' messages)

3. **Real-time Updates**: Used Socket.io for real-time message deletion across connected clients

4. **Local Filtering**: Initial message load filters deleted messages based on `getChatRoom()` logic; real-time deletions use socket events

5. **UI/UX**: 
   - Delete mode is separate from normal chat mode to avoid accidental deletions
   - Clear dialog with explanations for each deletion option
   - Visual feedback (ring on selected messages, button state changes)

## Files Modified/Created

### Created:
- `/backend/database/migrations/011_add_message_deletion_tracking.sql`

### Modified:
- `/backend/src/socket.js` - Added chat:delete_message handler
- `/backend/modules/chat/chat.controller.js` - Added deleteMessage function and updated getChatRoom
- `/backend/modules/chat/chat.routes.js` - Added DELETE /message/:messageId route
- `/frontend/src/components/student/chat/StudentChatLayout.tsx` - Full deletion UI/logic
- `/frontend/src/components/lecturer/chat/LecturerChatLayout.tsx` - Full deletion UI/logic
- `/backend/database/run_in_supabase.sql` - Added migration SQL for manual application

## How to Apply Changes

### Database:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and run the migration SQL from `/backend/database/migrations/011_add_message_deletion_tracking.sql`
3. Or run from `run_in_supabase.sql` starting at the migration comment

### Code:
1. Pull latest changes
2. Backend automatically picks up socket and route changes on restart
3. Frontend components automatically reload with new delete UI

## Future Enhancements

- [ ] Bulk delete confirmation with count preview
- [ ] Archive messages instead of deletion (maintain history)
- [ ] Delete reactions/edits that are missing
- [ ] Deletion scheduled for future time
- [ ] Admin ability to view deleted messages
- [ ] Message retention policies
