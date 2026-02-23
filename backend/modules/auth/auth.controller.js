import * as authService from './auth.service.js';
import * as authValidation from './auth.validation.js';

/**
 * POST /auth/student/login
 * Body: { admission_number, password }
 */
export async function studentLogin(req, res, next) {
  try {
    const result = authValidation.validateStudentLogin(req.body);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors,
      });
    }

    const { token, user } = await authService.loginStudent(
      result.data.admission_number,
      result.data.password
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user },
    });
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({
      success: false,
      message: err.message || 'Login failed',
    });
  }
}

/**
 * POST /auth/lecturer/login
 * Body: { staff_number, password }
 */
export async function lecturerLogin(req, res, next) {
  try {
    const result = authValidation.validateLecturerLogin(req.body);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors,
      });
    }

    const { token, user } = await authService.loginLecturer(
      result.data.staff_number,
      result.data.password
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user },
    });
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({
      success: false,
      message: err.message || 'Login failed',
    });
  }
}
