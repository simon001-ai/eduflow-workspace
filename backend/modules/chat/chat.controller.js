import { getSupabase } from '../../src/config/supabaseClient.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for images
const imageUpload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => cb(null, 'uploads/'),
		filename: (req, file, cb) => {
			const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
			cb(null, 'chat-img-' + uniqueSuffix + path.extname(file.originalname));
		},
	}),
	fileFilter: (req, file, cb) => {
		const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed'));
		}
	},
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Multer config for documents
const documentUpload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => cb(null, 'uploads/'),
		filename: (req, file, cb) => {
			const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
			cb(null, 'chat-doc-' + uniqueSuffix + path.extname(file.originalname));
		},
	}),
	fileFilter: (req, file, cb) => {
		const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('File type not allowed'));
		}
	},
	limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

export { imageUpload, documentUpload };

/**
 * Upload image for chat
 */
export async function uploadImage(req, res, next) {
	try {
		if (!req.file) {
			return res.status(400).json({ success: false, message: 'No file uploaded' });
		}

		const filePath = `/uploads/${req.file.filename}`;
		console.log('[Chat Controller] Image uploaded:', { filename: req.file.filename, size: req.file.size });

		return res.json({
			success: true,
			data: {
				file_path: req.file.filename,
				file_name: req.file.originalname,
				file_size: req.file.size,
				file_url: filePath,
			},
		});
	} catch (err) {
		console.error('[Chat Controller] Error uploading image:', err.message);
		return next(err);
	}
}

/**
 * Upload document for chat
 */
export async function uploadDocument(req, res, next) {
	try {
		if (!req.file) {
			return res.status(400).json({ success: false, message: 'No file uploaded' });
		}

		const filePath = `/uploads/${req.file.filename}`;
		console.log('[Chat Controller] Document uploaded:', { filename: req.file.filename, size: req.file.size });

		return res.json({
			success: true,
			data: {
				file_path: req.file.filename,
				file_name: req.file.originalname,
				file_size: req.file.size,
				file_url: filePath,
			},
		});
	} catch (err) {
		console.error('[Chat Controller] Error uploading document:', err.message);
		return next(err);
	}
}

/**
 * Get lecturers teaching a student (from registered units)
 */
export async function getStudentLecturers(req, res, next) {
	try {
		const { student_id } = req.params;
		if (!student_id) {
			return res.status(400).json({ success: false, message: 'Student ID required' });
		}

		const supabase = getSupabase();

		// Get all units this student is registered for
		const { data: registrations, error: regErr } = await supabase
			.from('student_unit_registrations')
			.select('unit_id')
			.eq('student_id', student_id);
		if (regErr) throw regErr;

		if (!registrations || registrations.length === 0) {
			return res.json({ success: true, data: [] });
		}

		const unitIds = registrations.map(r => r.unit_id);

		// Get all lecturers teaching these units
		const { data: assignments, error: assignErr } = await supabase
			.from('lecturer_unit_assignments')
			.select('lecturer_id')
			.in('unit_id', unitIds);
		if (assignErr) throw assignErr;

		const lecturerIds = [...new Set((assignments || []).map(a => a.lecturer_id))];

		if (lecturerIds.length === 0) {
			return res.json({ success: true, data: [] });
		}

		// Get lecturer details
		const { data: lecturers, error: lecErr } = await supabase
			.from('lecturers')
			.select('id, full_name, institutional_email')
			.in('id', lecturerIds);
		if (lecErr) throw lecErr;

		res.json({ success: true, data: lecturers });
	} catch (e) {
		console.error('[Chat Controller] Error getting student lecturers:', e);
		next(e);
	}
}

/**
 * Get students in a specific unit (for lecturer)
 */
export async function getUnitStudents(req, res, next) {
	try {
		const { unit_id } = req.params;
		if (!unit_id) {
			return res.status(400).json({ success: false, message: 'Unit ID required' });
		}

		const supabase = getSupabase();

		// Get all students registered in this unit
		const { data: registrations, error: regErr } = await supabase
			.from('student_unit_registrations')
			.select('student_id')
			.eq('unit_id', unit_id);
		if (regErr) throw regErr;

		if (!registrations || registrations.length === 0) {
			return res.json({ success: true, data: [] });
		}

		const studentIds = registrations.map(r => r.student_id);

		// Get student details
		const { data: students, error: studErr } = await supabase
			.from('students')
			.select('id, fullname, admission_number, email')
			.in('id', studentIds)
			.order('fullname');
		if (studErr) throw studErr;

		res.json({ success: true, data: students });
	} catch (e) {
		console.error('[Chat Controller] Error getting unit students:', e);
		next(e);
	}
}

/**
 * Get chat room (conversation between two users)
 */
export async function getChatRoom(req, res, next) {
	try {
		const { otherId } = req.params;
		const userId = req.user.student_id || req.user.lecturer_id;
		const userRole = req.user.role;

		if (!otherId || !userId) {
			return res.status(400).json({ success: false, message: 'Missing required parameters' });
		}

		const supabase = getSupabase();

		// Get all messages between these two users
		const { data: messages, error: msgErr } = await supabase
			.from('chat_messages')
			.select('*')
			.or(
				`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`
			)
			.order('created_at', { ascending: true });
		if (msgErr) throw msgErr;

		// Filter out deleted messages based on deletion scope
		const filteredMessages = (messages || []).filter(msg => {
			// Never show messages deleted for recipient (deleted for everyone)
			if (msg.deleted_for_recipient) return false;
			
			// Don't show to sender if sender deleted for themselves
			if (msg.deleted_for_sender && msg.sender_id === userId) return false;
			
			return true;
		});

		// Mark all messages sent to current user as read
		const { error: updateErr } = await supabase
			.from('chat_messages')
			.update({ is_read: true })
			.eq('recipient_id', userId)
			.eq('sender_id', otherId);
		if (updateErr) console.error('[Chat Controller] Error marking as read:', updateErr);

		res.json({ success: true, data: filteredMessages });
	} catch (e) {
		console.error('[Chat Controller] Error getting chat room:', e);
		next(e);
	}
}

/**
 * Get list of active conversations for user
 */
export async function getConversations(req, res, next) {
	try {
		const userId = req.user.student_id || req.user.lecturer_id;
		const userRole = req.user.role;

		if (!userId) {
			return res.status(400).json({ success: false, message: 'User not authenticated' });
		}

		const supabase = getSupabase();

		// Get all messages where user is sender or recipient
		const { data: messages, error: msgErr } = await supabase
			.from('chat_messages')
			.select('*')
			.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
			.order('created_at', { ascending: false });
		if (msgErr) throw msgErr;

		// Group by conversation (other participant)
		const conversations = {};
		(messages || []).forEach(msg => {
			const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
			const otherRole = msg.sender_id === userId ? msg.recipient_role : msg.sender_role;

			if (!conversations[otherId]) {
				conversations[otherId] = {
					otherId,
					otherRole,
					lastMessage: msg.content,
					lastMessageTime: msg.created_at,
					unreadCount: 0,
				};
			}

			if (msg.recipient_id === userId && !msg.is_read) {
				conversations[otherId].unreadCount += 1;
			}
		});

		// Fetch details of other users
		const otherIds = Object.keys(conversations);
		let otherUsers = [];

		if (otherIds.length > 0) {
			// Fetch lecturers
			const { data: lecturers } = await supabase
				.from('lecturers')
				.select('id, full_name')
				.in('id', otherIds.filter(id => conversations[id].otherRole === 'lecturer'));

			// Fetch students
			const { data: students } = await supabase
				.from('students')
				.select('id, fullname, admission_number')
				.in('id', otherIds.filter(id => conversations[id].otherRole === 'student'));

			otherUsers = [...(lecturers || []), ...(students || [])];
		}

		// Enrich conversations with user details
		const result = otherIds.map(otherId => {
			const conv = conversations[otherId];
			const user = otherUsers.find(u => u.id === otherId);
			return {
				...conv,
				otherName: user?.full_name || user?.fullname || 'Unknown',
				otherAdmission: user?.admission_number || null,
			};
		});

		res.json({ success: true, data: result });
	} catch (e) {
		console.error('[Chat Controller] Error getting conversations:', e);
		next(e);
	}
}

/**
 * Send a chat message
 */
export async function sendMessage(req, res, next) {
	try {
		const userId = req.user.student_id || req.user.lecturer_id;
		const userRole = req.user.role;
		const { recipient_id, recipient_role, content, message_type = 'text', file_path, file_name, file_size } = req.body;

		if (!recipient_id || !content) {
			return res.status(400).json({ success: false, message: 'Missing required fields' });
		}

		const supabase = getSupabase();

		// Create message
		const { data: message, error: msgErr } = await supabase
			.from('chat_messages')
			.insert({
				sender_id: userId,
				sender_role: userRole,
				recipient_id,
				recipient_role,
				content,
				message_type,
				file_path,
				file_name,
				file_size,
			})
			.select('*')
			.single();

		if (msgErr) throw msgErr;

		res.json({ success: true, data: message });
	} catch (e) {
		console.error('[Chat Controller] Error sending message:', e);
		next(e);
	}
}

/**
 * Get unread message count
 */
export async function getUnreadCount(req, res, next) {
	try {
		const userId = req.user.student_id || req.user.lecturer_id;

		if (!userId) {
			return res.status(400).json({ success: false, message: 'User not authenticated' });
		}

		const supabase = getSupabase();

		const { count: unreadCount, error: countErr } = await supabase
			.from('chat_messages')
			.select('*', { count: 'exact', head: true })
			.eq('recipient_id', userId)
			.eq('is_read', false);

		if (countErr) throw countErr;

		res.json({ success: true, data: { unreadCount: unreadCount || 0 } });
	} catch (e) {
		console.error('[Chat Controller] Error getting unread count:', e);
		next(e);
	}
}

/**
 * Delete a message for sender, or for both (delete for everyone)
 */
export async function deleteMessage(req, res, next) {
	try {
		const { messageId } = req.params;
		const userId = req.user.student_id || req.user.lecturer_id;
		const { deletion_type = 'self' } = req.body;

		if (!messageId) {
			return res.status(400).json({ success: false, message: 'Message ID required' });
		}

		if (!['self', 'everyone'].includes(deletion_type)) {
			return res.status(400).json({ success: false, message: 'Invalid deletion type' });
		}

		const supabase = getSupabase();

		// Get the message to verify ownership
		const { data: message, error: fetchErr } = await supabase
			.from('chat_messages')
			.select('sender_id, recipient_id')
			.eq('id', messageId)
			.single();

		if (fetchErr || !message) {
			return res.status(404).json({ success: false, message: 'Message not found' });
		}

		// Only sender can delete their own message
		if (message.sender_id !== userId) {
			return res.status(403).json({ success: false, message: 'Unauthorized to delete this message' });
		}

		// Update deletion status based on type
		const updateData = deletion_type === 'everyone'
			? { deleted_for_sender: true, deleted_for_recipient: true }
			: { deleted_for_sender: true };

		const { error: updateErr } = await supabase
			.from('chat_messages')
			.update(updateData)
			.eq('id', messageId);

		if (updateErr) throw updateErr;

		res.json({ success: true, message: 'Message deleted successfully', data: { messageId, deletion_type } });
	} catch (err) {
		console.error('[Chat Controller] Error deleting message:', err.message);
		next(err);
	}
}
