import { getSupabase } from '../../src/config/supabaseClient.js';
import { env } from '../../src/config/env.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import * as resourceService from './resource.service.js';

// GET /units/:unitId/resources
// Query param ?type=note|assignment|additional_material|cat (optional)
// If no type specified, returns all resources organized by type
export async function getResourcesForUnit(req, res, next) {
	const unitId = req.params.unitId;
	const type = req.query.type;
	
	try {
		console.log('[Resource Controller] Fetching resources for unit:', unitId, 'type:', type || 'ALL');
		
		// Validate unitId
		if (!unitId) {
			return res.status(400).json({ success: false, message: 'Unit ID is required' });
		}
		
		const resources = await resourceService.getResourcesForUnit(unitId, type);
		console.log('[Resource Controller] Found', resources.length, 'resources for unit', unitId);
		
		// If no type specified and we got an array, organize by type
		let organizedData = resources;
		if (!type && Array.isArray(resources)) {
			organizedData = {
				notes: resources.filter(r => r.type === 'note'),
				assignments: resources.filter(r => r.type === 'assignment'),
				materials: resources.filter(r => r.type === 'additional_material'),
				cats: resources.filter(r => r.type === 'cat'),
			};
			console.log('[Resource Controller] Organized by type:', {
				notes: organizedData.notes.length,
				assignments: organizedData.assignments.length,
				materials: organizedData.materials.length,
				cats: organizedData.cats.length
			});
		}
		
		res.json({ success: true, data: organizedData });
	} catch (err) {
		console.error('[Resource Controller] Error fetching resources for unit', unitId, ':', err.message);
		// Return empty data instead of error to gracefully handle missing resources
		res.json({ success: true, data: type ? [] : { notes: [], assignments: [], materials: [], cats: [] } });
	}
}
// Helper to get Socket.io instance from running server
let ioInstance = null;
export function setSocketIo(io) { ioInstance = io; }

/**
 * Lecturer uploads a resource (note, assignment, CAT, etc.)
 * Body: { unit_id, type, title, file_path, metadata }
 * Emits: 'new_resource' to unit:{unit_id}
 */
export async function uploadResource(req, res, next) {
	try {
		const lecturerId = req.user.lecturer_id;
		const { unit_id, type, title, file_path, metadata } = req.body;
		if (!unit_id || !type || !title || !file_path) {
			return res.status(400).json({ success: false, message: 'Missing required fields' });
		}
		const supabase = getSupabase();
		// Insert resource
		const { data: resource, error } = await supabase.from('resources').insert({
			unit_id,
			lecturer_id: lecturerId,
			type,
			title,
			file_path,
			metadata: metadata || null,
		}).select('*').single();
		if (error) throw error;

		// Find all students registered for this unit
		const { data: regs } = await supabase
			.from('student_unit_registrations')
			.select('student_id')
			.eq('unit_id', unit_id);
		const studentIds = (regs || []).map(r => r.student_id);

		// Insert notifications for each student
		const notifications = studentIds.map(student_id => ({
			student_id,
			resource_id: resource.id,
			type: `${type}_uploaded`,
			title,
		}));
		if (notifications.length) {
			await supabase.from('notifications').insert(notifications);
		}

		// Emit Socket.io event to unit room
		if (ioInstance) {
			ioInstance.to(`unit:${unit_id}`).emit('new_resource', {
				resource,
				notification_type: `${type}_uploaded`,
			});
		}

		return res.status(201).json({ success: true, data: resource });
	} catch (err) {
		next(err);
	}
}
