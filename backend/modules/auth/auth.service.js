import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../../src/config/supabaseClient.js';
import { env } from '../../src/config/env.js';

function signToken(payload) {
  if (!env.jwt.secret) {
    throw new Error('JWT_SECRET is not set in .env');
  }
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

/**
 * STUDENT LOGIN
 */
export async function loginStudent(admission_number, password) {
  const supabase = getSupabase();

  console.log('[LOGIN] student admission_number:', admission_number);

  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('admission_number', admission_number)
    .maybeSingle();

  console.log('[LOGIN] DB student:', student);
  console.log('[LOGIN] DB error:', error);

  if (!student) {
    const err = new Error('Invalid admission number or password');
    err.statusCode = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, student.password_hash);
  console.log('[LOGIN] password match:', match);

  if (!match) {
    const err = new Error('Invalid admission number or password');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken({
    role: 'student',
    student_id: student.id,
    sub: student.id,
  });

  return {
    token,
    user: {
      id: student.id,
      fullname: student.fullname,
      admission_number: student.admission_number,
      email: student.email,
      role: 'student',
    },
  };
}

/**
 * LECTURER LOGIN
 */
export async function loginLecturer(staff_number, password) {
  const supabase = getSupabase();

  console.log('[LOGIN] lecturer staff_number:', staff_number);

  const { data: lecturer, error } = await supabase
    .from('lecturers')
    .select('*')
    .eq('staff_number', staff_number)
    .maybeSingle();

  console.log('[LOGIN] DB lecturer:', lecturer);
  console.log('[LOGIN] DB error:', error);

  if (!lecturer) {
    const err = new Error('Invalid staff number or password');
    err.statusCode = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, lecturer.password_hash);
  console.log('[LOGIN] password match:', match);

  if (!match) {
    const err = new Error('Invalid staff number or password');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken({
    role: 'lecturer',
    lecturer_id: lecturer.id,
    sub: lecturer.id,
  });

  return {
    token,
    user: {
      id: lecturer.id,
      full_name: lecturer.full_name,
      institutional_email: lecturer.institutional_email,
      staff_number: lecturer.staff_number,
      role: 'lecturer',
    },
  };
}