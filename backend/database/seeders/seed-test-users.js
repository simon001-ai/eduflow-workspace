/**
 * Inserts test student and lecturer with bcrypt-hashed passwords.
 * Run from backend: npm run seed:users
 *
 * Requires .env with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import '../../src/config/env.js';
import { getSupabase } from '../../src/config/supabaseClient.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const student = {
  fullname: 'isho clem',
  admission_number: 'j77-3860-2023',
  email: 'j77-3860-2023@student.mksu.ac.ke',
  password: '123456',
};

const lecturer = {
  full_name: 'DR.osoro',
  institutional_email: 'njoroogu@gmail.com',
  staff_number: '001',
  password: '098765',
};

async function run() {
  try {
    const supabase = getSupabase();

    const studentHash = await bcrypt.hash(student.password, SALT_ROUNDS);
    const { error: studentError } = await supabase.from('students').insert({
      fullname: student.fullname,
      admission_number: student.admission_number,
      email: student.email,
      password_hash: studentHash,
    }).select('id').single();

    if (studentError) {
      if (studentError.code === '23505') {
        console.log('Student already exists (admission_number or email), skipping.');
      } else {
        throw new Error(`Student insert: ${studentError.message}`);
      }
    } else {
      console.log('Student inserted: isho clem (j77-3860-2023)');
    }

    const lecturerHash = await bcrypt.hash(lecturer.password, SALT_ROUNDS);
    const { error: lecturerError } = await supabase.from('lecturers').insert({
      full_name: lecturer.full_name,
      institutional_email: lecturer.institutional_email,
      staff_number: lecturer.staff_number,
      password_hash: lecturerHash,
    }).select('id').single();

    if (lecturerError) {
      if (lecturerError.code === '23505') {
        console.log('Lecturer already exists (staff_number or email), skipping.');
      } else {
        throw new Error(`Lecturer insert: ${lecturerError.message}`);
      }
    } else {
      console.log('Lecturer inserted: DR.osoro (001)');
    }

    console.log('Done. Use these to test login:');
    console.log('  Student:  admission_number=j77-3860-2023, password=123456');
    console.log('  Lecturer: staff_number=001, password=098765');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

run();
