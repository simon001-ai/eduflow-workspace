import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import { getSupabase } from './config/supabaseClient.js';

/**
 * Initializes Socket.io with JWT auth and room logic.
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT auth middleware for sockets
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) return next(new Error('No token provided'));
    try {
      const payload = jwt.verify(token, env.jwt.secret);
      socket.user = payload;
      return next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  // On connection, join user and unit rooms
  io.on('connection', async (socket) => {
    const { user } = socket;
    const supabase = getSupabase();
    try {
      if (user.role === 'student') {
        // Join private room
        socket.join(`user:${user.student_id}`);
        // Join all unit rooms for this student
        const { data: regs } = await supabase
          .from('student_unit_registrations')
          .select('unit_id')
          .eq('student_id', user.student_id);
        (regs || []).forEach(r => socket.join(`unit:${r.unit_id}`));
      } else if (user.role === 'lecturer') {
        socket.join(`user:${user.lecturer_id}`);
        // Join all unit rooms for this lecturer
        const { data: assigns } = await supabase
          .from('lecturer_unit_assignments')
          .select('unit_id')
          .eq('lecturer_id', user.lecturer_id);
        (assigns || []).forEach(a => socket.join(`unit:${a.unit_id}`));
      }
    } catch (err) {
      // Ignore join errors, but log
      console.error('[socket] Room join error:', err.message);
    }

    // Chat message handler
    socket.on('chat:message', async (data) => {
      try {
        const { recipient_id, content, message_type = 'text', file_path, file_name } = data;
        const sender_id = user.student_id || user.lecturer_id;
        const sender_role = user.role;

        // Save message to database
        const message = await (async () => {
          const { data: msg, error } = await supabase
            .from('chat_messages')
            .insert({
              sender_id,
              sender_role,
              recipient_id,
              recipient_role: sender_role === 'student' ? 'lecturer' : 'student',
              content,
              message_type,
              file_path,
              file_name,
            })
            .select('*')
            .single();

          if (error) throw error;
          return msg;
        })();

        // Emit to recipient's room (they receive the message)
        io.to(`user:${recipient_id}`).emit('chat:new_message', {
          ...message,
          sender_name: user.role === 'student' ? user.student_id : user.full_name || 'Lecturer',
          status: 'delivered'
        });

        // Emit to sender so they see their message as sent
        socket.emit('chat:message_sent', {
          ...message,
          status: 'sent'
        });

        console.log('[socket] Chat message sent:', { sender_id, recipient_id, message_id: message.id });
      } catch (err) {
        console.error('[socket] Error sending chat message:', err.message);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Join chat room
    socket.on('chat:join_room', (data) => {
      const { other_user_id } = data;
      if (!other_user_id) return;

      const current_user_id = user.student_id || user.lecturer_id;
      // Create a unique room ID (sort IDs to ensure same room for both users)
      const roomId = [current_user_id, other_user_id].sort().join(':');
      socket.join(`chat:${roomId}`);
      console.log('[socket] User joined chat room:', { roomId, userId: current_user_id });
    });

    // Leave chat room
    socket.on('chat:leave_room', (data) => {
      const { other_user_id } = data;
      if (!other_user_id) return;

      const current_user_id = user.student_id || user.lecturer_id;
      const roomId = [current_user_id, other_user_id].sort().join(':');
      socket.leave(`chat:${roomId}`);
      console.log('[socket] User left chat room:', { roomId, userId: current_user_id });
    });

    // Mark messages as read
    socket.on('chat:mark_read', async (data) => {
      try {
        const { other_user_id } = data;
        const current_user_id = user.student_id || user.lecturer_id;

        // Get all unread messages from sender
        const { data: messages, error: fetchErr } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('recipient_id', current_user_id)
          .eq('sender_id', other_user_id)
          .eq('is_read', false);

        if (fetchErr) throw fetchErr;

        // Mark them as read
        if (messages && messages.length > 0) {
          const { error: updateErr } = await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('recipient_id', current_user_id)
            .eq('sender_id', other_user_id);

          if (updateErr) throw updateErr;

          // Emit read status update for each message to sender
          messages.forEach(msg => {
            io.to(`user:${other_user_id}`).emit('chat:status_update', {
              message_id: msg.id,
              status: 'read'
            });
          });
        }

        console.log('[socket] Messages marked as read:', { reader_id: current_user_id, sender_id: other_user_id });
      } catch (err) {
        console.error('[socket] Error marking messages as read:', err.message);
      }
    });

    // Delete message handler
    socket.on('chat:delete_message', async (data) => {
      try {
        const { message_id, deletion_type } = data;
        const current_user_id = user.student_id || user.lecturer_id;

        // Get the message to verify ownership and get recipient info
        const { data: message, error: fetchErr } = await supabase
          .from('chat_messages')
          .select('sender_id, recipient_id')
          .eq('id', message_id)
          .single();

        if (fetchErr || !message) throw new Error('Message not found');

        // Verify user is sender of this message
        if (message.sender_id !== current_user_id) {
          return socket.emit('chat:error', { message: 'Unauthorized to delete this message' });
        }

        // Update deletion status based on type
        const updateData = deletion_type === 'everyone' 
          ? { deleted_for_sender: true, deleted_for_recipient: true }
          : { deleted_for_sender: true };

        const { error: updateErr } = await supabase
          .from('chat_messages')
          .update(updateData)
          .eq('id', message_id);

        if (updateErr) throw updateErr;

        // Notify both sender and recipient
        const deletedFor = deletion_type === 'everyone' ? 'both' : 'sender';
        io.to(`user:${current_user_id}`).emit('chat:message_deleted', {
          message_id,
          deleted_for: deletedFor
        });

        if (deletion_type === 'everyone') {
          io.to(`user:${message.recipient_id}`).emit('chat:message_deleted', {
            message_id,
            deleted_for: 'both'
          });
        }

        console.log('[socket] Message deleted:', { message_id, user_id: current_user_id, deletion_type });
      } catch (err) {
        console.error('[socket] Error deleting message:', err.message);
        socket.emit('chat:error', { message: 'Failed to delete message' });
      }
    });
  });

  // Expose to controllers

  import('../modules/resources/resource.controller.js').then(mod => {
    if (mod.setSocketIo) mod.setSocketIo(io);
  });
  import('../modules/submissions/submission.controller.js').then(mod => {
    if (mod.setSocketIo) mod.setSocketIo(io);
  });
  import('../modules/plagiarism/plagiarism.controller.js').then(mod => {
    if (mod.setSocketIo) mod.setSocketIo(io);
  });
  return io;
}
