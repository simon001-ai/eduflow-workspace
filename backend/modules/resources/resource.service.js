import { getSupabase } from '../../src/config/supabaseClient.js';

// Fetch resources for a unit with optional type filter
// If type is specified, returns filtered array
// If type is not specified, returns all resources (can be organized by caller)
export async function getResourcesForUnit(unitId, type) {
	if (!unitId) {
		throw new Error('Unit ID is required');
	}
	
	console.log('[Resource Service] Query: unit_id =', unitId, 'type =', type || 'ALL');
	
	const supabase = getSupabase();
	let query = supabase
		.from('resources')
		.select('id, unit_id, lecturer_id, type, title, file_path, metadata, created_at, updated_at')
		.eq('unit_id', unitId)
		.order('created_at', { ascending: false });
	
	if (type) {
		query = query.eq('type', type);
	}
	
	const { data, error } = await query;
	
	if (error) {
		console.error('[Resource Service] Supabase error:', error.message);
		throw error;
	}
	
	console.log('[Resource Service] Query returned', (data || []).length, 'results');
	if (data && data.length > 0) {
		console.log('[Resource Service] Sample resource:', {
			id: data[0].id,
			type: data[0].type,
			title: data[0].title,
			unit_id: data[0].unit_id
		});
	}
	
	return data || [];
}
