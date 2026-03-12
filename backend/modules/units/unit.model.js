// Unit model (logic only, not ORM)
// Represents a course/unit
export class Unit {
	constructor({ id, name, code, semester, academic_year }) {
		this.id = id;
		this.name = name;
		this.code = code;
		this.semester = semester;
		this.academic_year = academic_year;
	}
}
