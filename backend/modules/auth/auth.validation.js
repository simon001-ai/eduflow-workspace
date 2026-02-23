/**
 * Validates student login body: admission_number, password.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateStudentLogin(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body is required'] };
  }
  if (!body.admission_number || String(body.admission_number).trim() === '') {
    errors.push('admission_number is required');
  }
  if (!body.password || String(body.password) === '') {
    errors.push('password is required');
  }
  return {
    valid: errors.length === 0,
    errors,
    data: {
      admission_number: body.admission_number ? String(body.admission_number).trim() : '',
      password: body.password ? String(body.password) : '',
    },
  };
}

/**
 * Validates lecturer login body: staff_number, password.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateLecturerLogin(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body is required'] };
  }
  if (!body.staff_number || String(body.staff_number).trim() === '') {
    errors.push('staff_number is required');
  }
  if (!body.password || String(body.password) === '') {
    errors.push('password is required');
  }
  return {
    valid: errors.length === 0,
    errors,
    data: {
      staff_number: body.staff_number ? String(body.staff_number).trim() : '',
      password: body.password ? String(body.password) : '',
    },
  };
}
