import { getSupabase } from '../../src/config/supabaseClient.js';

// GET /api/units/:unitId
export async function getUnitById(req, res, next) {
	try {
		const { unitId } = req.params;
		const supabase = getSupabase();
		const { data, error } = await supabase
			.from('units')
			.select('id, code, name, semester, academic_year')
			.eq('id', unitId)
			.maybeSingle();
		if (error) throw error;
		if (!data) return res.status(404).json({ success: false, message: 'Unit not found' });
		res.json({ success: true, data });
	} catch (e) {
		next(e);
	}
}
import * as unitService from './unit.service.js';

// GET /students/:studentId/units
export async function getUnitsForStudent(req, res, next) {
	try {
		const studentId = req.params.studentId;
		// Optionally, check req.user.student_id === studentId for security
		const units = await unitService.getUnitsForStudent(studentId);
		res.json({ success: true, data: units });
	} catch (err) {
		next(err);
	}
}
