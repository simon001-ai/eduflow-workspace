// GET /api/lecturers/students/:studentId/lecturers
export async function getLecturersForStudent(req, res, next) {
	try {
		const { studentId } = req.params;
		const supabase = getSupabase();
		// 1. Get all unit_ids the student is registered for
		const { data: regs, error: regErr } = await supabase
			.from('student_unit_registrations')
			.select('unit_id')
			.eq('student_id', studentId);
		if (regErr) throw regErr;
		const unitIds = (regs || []).map(r => r.unit_id);
		if (!unitIds.length) return res.json({ success: true, data: [] });

		// 2. Get all lecturer_ids for those units from lecturer_unit_assignments
		const { data: assignments, error: assignErr } = await supabase
			.from('lecturer_unit_assignments')
			.select('lecturer_id')
			.in('unit_id', unitIds);
		if (assignErr) throw assignErr;
		const lecturerIds = [...new Set((assignments || []).map(a => a.lecturer_id).filter(Boolean))];
		if (!lecturerIds.length) return res.json({ success: true, data: [] });

		// 3. Get lecturer details
		const { data: lecturers, error: lecErr } = await supabase
			.from('lecturers')
			.select('id, full_name, institutional_email')
			.in('id', lecturerIds);
		if (lecErr) throw lecErr;
		res.json({ success: true, data: lecturers });
	} catch (e) {
		next(e);
	}
}
// GET /api/lecturers/submissions
export async function getLecturerSubmissions(req, res, next) {
	try {
		const lecturerId = req.user.lecturer_id;
		const supabase = getSupabase();
		// Get all units taught by lecturer
		const { data: assignments, error: assignErr } = await supabase
			.from('lecturer_unit_assignments')
			.select('unit_id, units(id, name, code)')
			.eq('lecturer_id', lecturerId);
		if (assignErr) throw assignErr;
		const unitMap = {};
		(assignments || []).forEach(a => {
			if (a.units) {
				unitMap[a.unit_id] = { 
					id: a.units.id,
					name: a.units.name, 
					code: a.units.code, 
					submissions: [] 
				};
			}
		});
		const unitIds = Object.keys(unitMap);
		if (unitIds.length === 0) return res.json({ success: true, units: [] });

		// Get all resources for these units
		const { data: resources, error: resErr } = await supabase
			.from('resources')
			.select('id, unit_id, type, title')
			.in('unit_id', unitIds);
		if (resErr) throw resErr;
		const resourceMap = {};
		(resources || []).forEach(r => {
			resourceMap[r.id] = { ...r };
		});
		const resourceIds = Object.keys(resourceMap);
		if (resourceIds.length === 0) return res.json({ success: true, units: Object.entries(unitMap).map(([unit_id, info]) => ({
			unit_id,
			name: info.name,
			code: info.code,
			submissions: []
		})) });

		// Get all submissions for these resources with all available fields
		// Join with students table to get admission_number and fullname
		// Note: Some fields like ai_score, extracted_text, status may not exist yet
		// They will be null if columns don't exist
		const { data: submissions, error: subErr } = await supabase
			.from('submissions')
			.select('id, student_id, resource_id, file_path, plagiarism_percentage, ai_score, grade, feedback, extracted_text, status, created_at, students(fullname, admission_number)', { head: false })
			.in('resource_id', resourceIds);
		
		if (subErr) {
			// If query fails due to missing columns, try with available columns
			if (subErr.message && subErr.message.includes('does not exist')) {
				const { data: submissionsBasic, error: subErrBasic } = await supabase
					.from('submissions')
					.select('id, student_id, resource_id, file_path, plagiarism_percentage, grade, feedback, created_at, students(fullname, admission_number)')
					.in('resource_id', resourceIds);
				if (subErrBasic) throw subErrBasic;
				// Add null values for missing columns
				submissionsBasic.forEach(sub => {
					sub.ai_score = null;
					sub.extracted_text = null;
					sub.status = sub.grade ? 'graded' : 'submitted';
				});
				return await processSubmissions(submissionsBasic, resourceMap, unitMap, res);
			}
			throw subErr;
		}

		return await processSubmissions(submissions, resourceMap, unitMap, res);
	} catch (e) {
		next(e);
	}
}

// Helper function to process submissions
async function processSubmissions(submissions, resourceMap, unitMap, res) {
	const supabase = getSupabase();
	
	// Attach submissions to units by resource->unit
	for (const sub of submissions || []) {
		const resource = resourceMap[sub.resource_id];
		if (resource && unitMap[resource.unit_id]) {
			// Fetch AI detection report for this submission
			const { data: aiReport } = await supabase
				.from('ai_detection_reports')
				.select('*')
				.eq('submission_id', sub.id)
				.maybeSingle();

			// Extract student data from the joined students object
			const studentData = sub.students || {};
			unitMap[resource.unit_id].submissions.push({
				...sub,
				resource_type: resource.type,
				resource_title: resource.title,
				student_name: studentData.fullname || 'Unknown',
				student_admission_number: studentData.admission_number || 'N/A',
				ai_probability: aiReport?.ai_probability || null,
				human_probability: aiReport?.human_probability || null,
				ai_detection_report: aiReport || null
			});
		}
	}

	// Format response: array of units with submissions
	const units = Object.entries(unitMap).map(([unit_id, info]) => ({
		unit_id,
		name: info.name,
		code: info.code,
		submissions: info.submissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
	}));
	res.json({ success: true, units });
}

import multer from 'multer';
import path from 'path';
import * as resourceController from '../resources/resource.controller.js';

const upload = multer({
	dest: path.join(process.cwd(), 'uploads'),
	fileFilter: (req, file, cb) => {
		const allowed = [
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation'
		];
		cb(null, allowed.includes(file.mimetype));
	}
});

// GET /api/lecturers/units
export async function getLecturerUnits(req, res, next) {
	try {
		const lecturerId = req.user.lecturer_id;
		const supabase = getSupabase();
		const { data, error } = await supabase
				.from('lecturer_unit_assignments')
				.select('unit_id, units(name, code)')
				.eq('lecturer_id', lecturerId);
		if (error) throw error;
		// Filter out duplicate units by unit_id
		const seen = new Set();
		const units = (data || []).map(a => ({
			id: a.unit_id,
			code: a.units?.code,
			name: a.units?.name
		})).filter(unit => {
			if (seen.has(unit.id)) return false;
			seen.add(unit.id);
			return true;
		});
		res.json({ success: true, units });
	} catch (e) {
		next(e);
	}
}

// POST /api/lecturers/resources/upload
export const uploadResource = [
	upload.single('file'),
	async (req, res, next) => {
		try {
			const lecturerId = req.user.lecturer_id;
			const { unit_id, title, type, metadata } = req.body;
			// Validate lecturer assignment
			const supabase = getSupabase();
			const { count } = await supabase
				.from('lecturer_unit_assignments')
				.select('id', { count: 'exact', head: true })
				.eq('lecturer_id', lecturerId)
				.eq('unit_id', unit_id);
			if (!count) return res.status(403).json({ success: false, message: 'Not assigned to this unit' });

			// Save file info in resources table
			const file_path = `/uploads/${req.file.filename}`;
			// Call the main resource upload logic to trigger notifications, etc.
			req.body = { unit_id, type, title, file_path, metadata };
			req.user.lecturer_id = lecturerId;
			// Call resourceController.uploadResource as middleware
			return resourceController.uploadResource(req, res, next);
		} catch (e) {
			next(e);
		}
	}
];

// GET /api/lecturers/resources/:unitId
export async function getUnitResources(req, res, next) {
	try {
		const lecturerId = req.user.lecturer_id;
		const { unitId } = req.params;
		// Validate lecturer assignment
		const supabase = getSupabase();
		const { count } = await supabase
			.from('lecturer_unit_assignments')
			.select('id', { count: 'exact', head: true })
			.eq('lecturer_id', lecturerId)
			.eq('unit_id', unitId);
		if (!count) return res.status(403).json({ success: false, message: 'Not assigned to this unit' });

		// Get resources
		const { data, error } = await supabase
			.from('resources')
			.select('*')
			.eq('unit_id', unitId)
			.eq('lecturer_id', lecturerId)
			.order('created_at', { ascending: false });
		if (error) throw error;
		res.json({ success: true, resources: data });
	} catch (e) {
		next(e);
	}
}
import { getSupabase } from '../../src/config/supabaseClient.js';

// GET /api/lecturers/dashboard
export async function getLecturerDashboard(req, res, next) {
	try {
		const lecturerId = req.user.lecturer_id;
		const supabase = getSupabase();

		console.log('[Dashboard] Fetching stats for lecturer:', lecturerId);

		// 1. Get all units assigned to this lecturer (with unit details)
		const { data: assignments, error: assignErr } = await supabase
			.from('lecturer_unit_assignments')
			.select('unit_id, units(id, name, code)')
			.eq('lecturer_id', lecturerId);
		if (assignErr) throw assignErr;
		
		const activeUnits = (assignments || []).map(a => a.units).filter(Boolean);
		const unitIds = (assignments || []).map(a => a.unit_id).filter(Boolean);
		const unitsTeachingCount = assignments?.length || 0;
		
		console.log('[Dashboard] Units teaching:', unitsTeachingCount);
		console.log('[Dashboard] Unit IDs:', unitIds);

		// 2. Get total unique students registered in these units
		let totalStudentsCount = 0;
		if (unitIds.length > 0) {
			const { data: students, error: studErr } = await supabase
				.from('student_unit_registrations')
				.select('student_id')
				.in('unit_id', unitIds);
			if (studErr) throw studErr;
			
			// Get unique student count
			const uniqueStudentIds = [...new Set((students || []).map(s => s.student_id))];
			totalStudentsCount = uniqueStudentIds.length;
			console.log('[Dashboard] Total students in units:', totalStudentsCount);
		}

		// 3. Get total resources uploaded by this lecturer
		const { count: resourceCount, error: resCountErr } = await supabase
			.from('resources')
			.select('id', { count: 'exact', head: true })
			.eq('lecturer_id', lecturerId);
		if (resCountErr) throw resCountErr;
		console.log('[Dashboard] Resources uploaded:', resourceCount || 0);

		// 4. Get total ungraded submissions (new submissions)
		let newSubmissionsCount = 0;
		if (unitIds.length > 0) {
			// Get all resources for this lecturer's units
			const { data: resources, error: resErr } = await supabase
				.from('resources')
				.select('id')
				.eq('lecturer_id', lecturerId);
			if (resErr) throw resErr;
			
			const resourceIds = (resources || []).map(r => r.id);
			
			if (resourceIds.length > 0) {
				const { count: unreadCount, error: subCountErr } = await supabase
					.from('submissions')
					.select('id', { count: 'exact', head: true })
					.in('resource_id', resourceIds)
					.is('grade', null);
				if (subCountErr) throw subCountErr;
				
				newSubmissionsCount = unreadCount || 0;
			}
			console.log('[Dashboard] New submissions:', newSubmissionsCount);
		}

		res.json({
			newSubmissionsCount,
			totalStudentsCount,
			resourceCount: resourceCount || 0,
			activeUnits,
			unitsTeachingCount
		});
	} catch (e) {
		console.error('[Dashboard] Error:', e);
		next(e);
	}
}
