/**
 * Generic error handler middleware for Express.
 * Catches JSON parse errors from body-parser and other errors,
 * and returns a consistent JSON response.
 */
export default function errorHandler(err, req, res, next) {
	// Handle JSON parse errors from body-parser
	if (err && err.type === 'entity.parse.failed') {
		return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
	}

	if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
	}

	const status = err && err.statusCode ? err.statusCode : err && err.status ? err.status : 500;
	const message = err && err.message ? err.message : 'Internal server error';
	return res.status(status).json({ success: false, message });
}

