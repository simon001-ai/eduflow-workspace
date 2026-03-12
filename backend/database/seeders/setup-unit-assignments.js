/**
 * Seeder: Setup lecturer unit assignments
 * Assigns Dr.osoro to teach Operating Systems Semester 2
 * Registers student Clem to the same unit
 * 
 * Run from backend directory:
 * node database/seeders/setup-unit-assignments.js
 */

import '../../src/config/env.js';
import { getSupabase } from '../../src/config/supabaseClient.js';

async function run() {
  try {
    const supabase = getSupabase();

    console.log('🔄 Setting up lecturer unit assignments...\n');

    // =======================================================
    // 1. Create/verify the unit
    // =======================================================
    console.log('1️⃣  Creating/verifying unit: Operating Systems (CS201)...');
    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .upsert({
        name: 'Operating Systems',
        code: 'CS201',
        semester: 'Semester 2',
        academic_year: '2025/2026'
      }, { onConflict: 'code' })
      .select('id')
      .single();

    if (unitError && unitError.code !== '23505') throw unitError;
    const unitId = unitData.id;
    console.log(`   ✓ Unit created/verified with ID: ${unitId}\n`);

    // =======================================================
    // 2. Get student ID
    // =======================================================
    console.log('2️⃣  Finding student: isho clem (j77-3860-2023)...');
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('admission_number', 'j77-3860-2023')
      .single();
    
    if (studentError) throw new Error(`Student not found: ${studentError.message}`);
    console.log(`   ✓ Student found with ID: ${student.id}\n`);

    // =======================================================
    // 3. Register student to unit
    // =======================================================
    console.log('3️⃣  Registering student to Operating Systems unit...');
    const { data: regData, error: regError } = await supabase
      .from('student_unit_registrations')
      .insert({
        student_id: student.id,
        unit_id: unitId,
        semester: 'Semester 2',
        academic_year: '2025/2026'
      })
      .select();
    
    if (regError && regError.code !== '23505') throw regError;
    console.log(`   ✓ Student registered to unit\n`);

    // =======================================================
    // 4. Get lecturer ID
    // =======================================================
    console.log('4️⃣  Finding lecturer: DR.osoro (001)...');
    const { data: lecturer, error: lecturerError } = await supabase
      .from('lecturers')
      .select('id')
      .eq('staff_number', '001')
      .single();
    
    if (lecturerError) throw new Error(`Lecturer not found: ${lecturerError.message}`);
    console.log(`   ✓ Lecturer found with ID: ${lecturer.id}\n`);

    // =======================================================
    // 5. Assign lecturer to unit
    // =======================================================
    console.log('5️⃣  Assigning lecturer to Operating Systems unit...');
    const { data: assignData, error: assignError } = await supabase
      .from('lecturer_unit_assignments')
      .insert({
        lecturer_id: lecturer.id,
        unit_id: unitId,
        semester: 'Semester 2',
        academic_year: '2025/2026'
      })
      .select();
    
    if (assignError && assignError.code !== '23505') throw assignError;
    console.log(`   ✓ Lecturer assigned to unit\n`);

    // =======================================================
    // Verification
    // =======================================================
    console.log('6️⃣  Verifying setup...\n');

    // Check unit
    const { data: unit } = await supabase
      .from('units')
      .select('*')
      .eq('code', 'CS201')
      .single();
    console.log('   Unit Details:');
    console.log(`   - Name: ${unit.name}`);
    console.log(`   - Code: ${unit.code}`);
    console.log(`   - Semester: ${unit.semester}`);
    console.log(`   - Year: ${unit.academic_year}\n`);

    // Check student registration
    const { data: registration } = await supabase
      .from('student_unit_registrations')
      .select(`
        student_id,
        unit_id,
        semester,
        academic_year,
        students(fullname, admission_number),
        units(name, code)
      `)
      .eq('student_id', student.id)
      .eq('unit_id', unitId)
      .single();
    
    console.log('   Student Registration:');
    console.log(`   - Student: ${registration.students.fullname} (${registration.students.admission_number})`);
    console.log(`   - Unit: ${registration.units.code} - ${registration.units.name}`);
    console.log(`   - Semester: ${registration.semester}`);
    console.log(`   - Year: ${registration.academic_year}\n`);

    // Check lecturer assignment
    const { data: assignment } = await supabase
      .from('lecturer_unit_assignments')
      .select(`
        lecturer_id,
        unit_id,
        semester,
        academic_year,
        lecturers(full_name, staff_number),
        units(name, code)
      `)
      .eq('lecturer_id', lecturer.id)
      .eq('unit_id', unitId)
      .single();
    
    console.log('   Lecturer Assignment:');
    console.log(`   - Lecturer: ${assignment.lecturers.full_name} (${assignment.lecturers.staff_number})`);
    console.log(`   - Unit: ${assignment.units.code} - ${assignment.units.name}`);
    console.log(`   - Semester: ${assignment.semester}`);
    console.log(`   - Year: ${assignment.academic_year}\n`);

    console.log('✅ Database setup complete!\n');
    console.log('📋 Next Steps:');
    console.log('1. Login as Dr.osoro (staff_number: 001, password: 098765)');
    console.log('2. Upload a resource to the "Operating Systems" unit');
    console.log('3. Login as Clem (admission_number: j77-3860-2023, password: 123456)');
    console.log('4. Submit the assignment');
    console.log('5. Login back as Dr.osoro');
    console.log('6. Go to "Student Submissions" and grade the submission\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
