import { getSupabase } from '../../src/config/supabaseClient.js';
import { env } from '../../src/config/env.js';

let ioInstance = null;
export function setSocketIo(io) { ioInstance = io; }

// Get submission details for viewing
export async function getSubmissionDetails(req, res, next) {
	try {
		const { id } = req.params;
		const supabase = getSupabase();
		
		// Fetch submission with all details
		const { data: submission, error } = await supabase
			.from('submissions')
			.select(`
				id,
				student_id,
				resource_id,
				file_path,
				plagiarism_percentage,
				ai_score,
				grade,
				feedback,
				extracted_text,
				status,
				created_at
			`)
			.eq('id', id)
			.maybeSingle();
		
		if (error || !submission) throw error || new Error('Submission not found');
		
		// Fetch resource info
		const { data: resource, error: resError } = await supabase
			.from('resources')
			.select('id, title, type, unit_id')
			.eq('id', submission.resource_id)
			.maybeSingle();
		
		if (resError) throw resError;

		// Fetch AI detection report with sentence-level analysis
		const { data: aiReport, error: aiErr } = await supabase
			.from('ai_detection_reports')
			.select('ai_probability, human_probability, sentence_level_analysis')
			.eq('submission_id', id)
			.maybeSingle();
		
		if (aiErr) console.warn('Error fetching AI report:', aiErr);

		// Fetch plagiarism reports with matching segments
		const { data: plagiarismReports, error: reportsErr } = await supabase
			.from('plagiarism_analysis')
			.select('similarity_score, matching_segments')
			.eq('submission_id', id);

		if (reportsErr) console.warn('Error fetching plagiarism reports:', reportsErr);

		// Extract flagged sections from AI detection report
		let aiFlaggedSections = [];
		if (aiReport?.sentence_level_analysis) {
			try {
				const sentences = Array.isArray(aiReport.sentence_level_analysis)
					? aiReport.sentence_level_analysis
					: JSON.parse(aiReport.sentence_level_analysis);

				aiFlaggedSections = sentences
					.filter(sentence => sentence.ai_probability > 70) // Flag sentences with >70% AI probability
					.map(sentence => ({
						type: 'ai_detected',
						text: sentence.text,
						ai_probability: sentence.ai_probability,
						human_probability: sentence.human_probability
					}));
			} catch (parseErr) {
				console.warn('Error parsing AI sentence analysis:', parseErr.message);
			}
		}

		// Extract flagged sections from plagiarism reports
		let plagiarismFlaggedSections = [];
		if (plagiarismReports && plagiarismReports.length > 0) {
			plagiarismFlaggedSections = plagiarismReports
				.filter(report => report.similarity_score > 15) // Only include high similarity matches
				.map(report => {
					try {
						const segments = Array.isArray(report.matching_segments)
							? report.matching_segments
							: JSON.parse(report.matching_segments || '[]');

						return segments
							.filter(segment => segment.similarity > 15)
							.map(segment => ({
								type: 'plagiarism',
								text: segment.text || segment.matching_text,
								similarity: segment.similarity || report.similarity_score,
								source: 'Previous submission'
							}));
					} catch (parseErr) {
						console.warn('Error parsing plagiarism matching segments:', parseErr.message);
						return [];
					}
				})
				.flat();
		}

		// Combine all flagged sections
		const allFlaggedSections = [...aiFlaggedSections, ...plagiarismFlaggedSections];

		// Generate recommendations based on results
		const recommendations = [];
		const plagiarismScore = submission.plagiarism_percentage || 0;
		const aiScore = aiReport?.ai_probability || 0;

		if (plagiarismScore > 15) {
			recommendations.push('Consider rephrasing sections with high similarity to avoid plagiarism concerns.');
		}
		if (aiScore > 50) {
			recommendations.push('Review AI-generated content and ensure it aligns with your institution\'s policies.');
		}
		if (allFlaggedSections.length > 0) {
			recommendations.push('Review the flagged sections below and consider making revisions.');
		}
		if (recommendations.length === 0) {
			recommendations.push('Your submission appears to meet academic integrity standards.');
		}

		res.json({ 
			success: true, 
			data: {
				...submission,
				resource_title: resource?.title || 'Unknown',
				resource_type: resource?.type || 'unknown',
				ai_report: aiReport ? {
					ai_probability: aiReport.ai_probability,
					human_probability: aiReport.human_probability,
					sentences: aiReport.sentence_level_analysis || []
				} : null,
				flagged_sections: allFlaggedSections, // Add flagged sections to response
				recommendations: recommendations // Add recommendations to response
			}
		});
	} catch (e) {
		next(e);
	}
}

// Get detailed plagiarism report
export async function getPlagiarismReport(req, res, next) {
	try {
		const { id } = req.params;
		const supabase = getSupabase();
		const { data: submission, error } = await supabase.from('submissions').select('plagiarism_report_url, plagiarism_percentage').eq('id', id).maybeSingle();
		if (error || !submission) throw error || new Error('Submission not found');
		// Optionally fetch and return detailed report from Copyleaks
		res.json({ success: true, data: submission });
	} catch (e) {
		next(e);
	}
}

// Get detailed AI report
export async function getAIReport(req, res, next) {
	try {
		const { id } = req.params;
		const supabase = getSupabase();
		const { data: submission, error } = await supabase.from('submissions').select('ai_report_url').eq('id', id).maybeSingle();
		if (error || !submission) throw error || new Error('Submission not found');
		// Optionally fetch and return detailed report from AI provider
		res.json({ success: true, data: submission });
	} catch (e) {
		next(e);
	}
}


/**
 * Lecturer grades a submission
 * Body: { grade, feedback }
 * Updates: grade, feedback, status
 */
export async function gradeSubmission(req, res, next) {
	try {
		const lecturerId = req.user.lecturer_id;
		const submissionId = req.params.id;
		const { grade, feedback } = req.body;
		if (!grade) {
			return res.status(400).json({ success: false, message: 'Missing grade' });
		}
		const supabase = getSupabase();
		// Fetch submission to verify lecturer owns the resource
		const { data: submission, error: fetchErr } = await supabase
			.from('submissions')
			.select('id, resource_id')
			.eq('id', submissionId)
			.maybeSingle();
		if (fetchErr || !submission) throw fetchErr || new Error('Submission not found');
		// Fetch resource to verify lecturer
		const { data: resource, error: resErr } = await supabase
			.from('resources')
			.select('id, lecturer_id')
			.eq('id', submission.resource_id)
			.maybeSingle();
		if (resErr || !resource) throw resErr || new Error('Resource not found');
		if (resource.lecturer_id !== lecturerId) {
			return res.status(403).json({ success: false, message: 'Not authorized to grade this submission' });
		}
		// Update submission with grade and feedback
		const { data: updated, error: updateErr } = await supabase
			.from('submissions')
			.update({ grade, feedback, status: 'graded' })
			.eq('id', submissionId)
			.select('*')
			.maybeSingle();
		if (updateErr) throw updateErr;
		// Optionally: notify student here
		return res.status(200).json({ success: true, data: updated });
	} catch (err) {
		next(err);
	}
}

// Get student's submissions list (for dashboard/history)
export async function getStudentSubmissions(req, res, next) {
	try {
		const studentId = req.user.student_id;
		const { limit = 10, offset = 0 } = req.query;
		const supabase = getSupabase();
		
		// Fetch submissions
		const { data: submissions, error } = await supabase
			.from('submissions')
			.select(`
				id,
				student_id,
				resource_id,
				plagiarism_percentage,
				ai_score,
				status,
				submitted_at,
				created_at,
				resources(id, title, type, unit_id)
			`)
			.eq('student_id', studentId)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);
		
		if (error) throw error;
		
		res.json({ 
			success: true, 
			data: submissions || [],
			message: 'Submissions fetched successfully'
		});
	} catch (e) {
		next(e);
	}
}

/**
 * Student submits an analyzed document
 * Body: { submission_id, resource_id, student_id }
 * Marks submission as 'submitted' and notifies lecturer
 */
export async function submitAnalyzedDocument(req, res, next) {
	try {
		const { submission_id, resource_id, student_id } = req.body;
		if (!submission_id || !resource_id) {
			return res.status(400).json({ success: false, message: 'Missing submission_id or resource_id' });
		}

		const supabase = getSupabase();

		// Get resource to find lecturer and unit
		const { data: resource, error: resErr } = await supabase
			.from('resources')
			.select('id, unit_id, lecturer_id, type, title')
			.eq('id', resource_id)
			.maybeSingle();
		if (resErr || !resource) throw resErr || new Error('Resource not found');

		// Update submission status and mark submission timestamp
		const { data: submission, error: updateErr } = await supabase
			.from('submissions')
			.update({ 
				status: 'submitted',
				submitted_at: new Date().toISOString()
			})
			.eq('id', submission_id)
			.select('*')
			.single();
		if (updateErr) throw updateErr;

		// Fetch AI detection report for this submission
		const { data: aiReport } = await supabase
			.from('ai_detection_reports')
			.select('*')
			.eq('submission_id', submission_id)
			.maybeSingle();

		// Insert notification for lecturer
		const { error: notifErr } = await supabase.from('lecturer_notifications').insert({
			lecturer_id: resource.lecturer_id,
			resource_id: resource.id,
			type: 'assignment_uploaded',
			title: `New submission for ${resource.title}`,
			created_at: new Date().toISOString()
		});
		if (notifErr) console.error('Error creating lecturer notification:', notifErr);

		// Emit Socket.io event to lecturer if available
		if (ioInstance) {
			ioInstance.to(`user:${resource.lecturer_id}`).emit('new_submission', {
				submission_id: submission.id,
				student_id: submission.student_id,
				resource_id: resource.id,
				resource_title: resource.title,
				plagiarism_percentage: submission.plagiarism_percentage || 0,
				ai_score: aiReport?.ai_probability || null,
				ai_probability: aiReport?.ai_probability || null,
				human_probability: aiReport?.human_probability || null,
				status: submission.status,
				submitted_at: submission.submitted_at
			});
		}

		// Return submission with all details including ai scores and plagiarism data
		return res.status(200).json({ 
			success: true, 
			message: 'Document submitted successfully', 
			data: {
				id: submission.id,
				submission_id: submission.id,
				student_id: submission.student_id,
				resource_id: submission.resource_id,
				status: submission.status,
				plagiarism_percentage: submission.plagiarism_percentage || 0,
				ai_score: aiReport?.ai_probability || null,
				ai_probability: aiReport?.ai_probability || null,
				human_probability: aiReport?.human_probability || null,
				file_path: submission.file_path || submission.file_url,
				file_url: submission.file_url,
				extracted_text: submission.extracted_text,
				submitted_at: submission.submitted_at,
				created_at: submission.created_at,
				grade: submission.grade,
				feedback: submission.feedback,
				ai_detection_report: aiReport || null
			}
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Student submits an assignment
 * Body: { resource_id, file_path, plagiarism_percentage }
 * Emits: 'new_submission' to user:{lecturerId}
 */
export async function submitAssignment(req, res, next) {
	try {
		const studentId = req.user.student_id;
		const {
			resource_id,
			file_path,
			plagiarism_percentage,
			isAIGenerated = false,
			plagiarismReportUrl = null,
			status = 'draft'
		} = req.body;
		if (!resource_id || !file_path) {
			return res.status(400).json({ success: false, message: 'Missing required fields' });
		}
		const supabase = getSupabase();
		// Get resource to find unit and lecturer
		const { data: resource, error: resErr } = await supabase
			.from('resources')
			.select('id, unit_id, lecturer_id, type, title')
			.eq('id', resource_id)
			.maybeSingle();
		if (resErr || !resource) throw resErr || new Error('Resource not found');

		// Insert submission with new fields
		const { data: submission, error: subErr } = await supabase.from('submissions').insert({
			student_id: studentId,
			resource_id,
			file_path,
			plagiarism_percentage: plagiarism_percentage || null,
			is_ai_generated: isAIGenerated,
			plagiarism_report_url: plagiarismReportUrl,
			status
		}).select('*').single();
		if (subErr) throw subErr;

		// Only notify/emit if status is 'final'
		if (status === 'final') {
			// Insert notification for lecturer
			const { error: notifErr } = await supabase.from('lecturer_notifications').insert({
				lecturer_id: resource.lecturer_id,
				resource_id: resource.id,
				type: 'assignment_uploaded',
				title: `New assignment from student for ${resource.title} with ${plagiarism_percentage || 0}% plagiarism detected`,
			});
			if (notifErr) console.error('Error creating lecturer notification:', notifErr);

			// Emit Socket.io event to lecturer
			if (ioInstance) {
				ioInstance.to(`user:${resource.lecturer_id}`).emit('new_assignment', {
					submission,
					resource,
					plagiarism_percentage: plagiarism_percentage || 0,
					notification_type: 'assignment_uploaded',
				});
			}
		}

		return res.status(201).json({ success: true, data: submission });
	} catch (err) {
		next(err);
	}
}

/**
 * Cancel a submission (for redo option)
 * Allows canceling from: draft, analyzed, analyzing states
 */
export async function cancelSubmission(req, res, next) {
	try {
		const studentId = req.user.student_id;
		const { submissionId } = req.params;
		const supabase = getSupabase();

		// Verify submission belongs to student
		const { data: submission, error: fetchErr } = await supabase
			.from('submissions')
			.select('id, student_id, status')
			.eq('id', submissionId)
			.maybeSingle();

		if (fetchErr || !submission) {
			return res.status(404).json({ success: false, message: 'Submission not found' });
		}

		if (submission.student_id !== studentId) {
			return res.status(403).json({ success: false, message: 'Unauthorized' });
		}

		// Allow canceling from draft, analyzed, or analyzing states
		const allowedStatuses = ['draft', 'analyzed', 'analyzing'];
		if (!allowedStatuses.includes(submission.status)) {
			return res.status(400).json({ 
				success: false, 
				message: `Cannot cancel submission with status: ${submission.status}` 
			});
		}

		// Delete the submission
		const { error: deleteErr } = await supabase
			.from('submissions')
			.delete()
			.eq('id', submissionId);

		if (deleteErr) throw deleteErr;

		res.json({ success: true, message: 'Submission cancelled successfully' });
	} catch (err) {
		next(err);
	}
}
