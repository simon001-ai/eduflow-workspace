import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

export default function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, env.jwt.secret);
        // Normalize user id for both students and lecturers
        if (payload.student_id) payload.id = payload.student_id;
        if (payload.lecturer_id) payload.id = payload.lecturer_id;
        req.user = payload;
        next();
    } catch (err) {
        // Debug log for troubleshooting
        console.error('[auth.middleware] JWT error:', err.message, 'Token:', token);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}