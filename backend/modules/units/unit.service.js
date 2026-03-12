import { getSupabase } from '../../src/config/supabaseClient.js';

// Fetch all units registered for a student
export async function getUnitsForStudent(studentId) {
	const supabase = getSupabase();
	const { data, error } = await supabase
		.from('student_unit_registrations')
		.select('unit_id, units(*)')
		.eq('student_id', studentId);
	if (error) throw error;
	// Flatten to just unit objects
	return (data || []).map(r => r.units);
}
