import { getSupabase } from '../../src/config/supabaseClient.js';

// GET /students/:studentId/notifications
export async function getStudentNotifications(req, res, next) {
	try {
		const studentId = req.params.studentId;
		// Optionally, check req.user.student_id === studentId for security
		const supabase = getSupabase();
		const { data, error } = await supabase
			.from('notifications')
			.select('*')
			.eq('student_id', studentId)
			.order('created_at', { ascending: false });
		if (error) throw error;
		res.json({ success: true, data });
	} catch (err) {
		next(err);
	}
}
