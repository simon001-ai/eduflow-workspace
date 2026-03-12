/**
 * Role-based access middleware for Express.
 * Usage: roleMiddleware('student'), roleMiddleware('lecturer')
 */
export default function roleMiddleware(requiredRole) {
	return (req, res, next) => {
		if (!req.user || req.user.role !== requiredRole) {
			return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
		}
		next();
	};
}
