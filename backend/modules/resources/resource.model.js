// Resource model (logic only, not ORM)
// Represents a resource (note, assignment, additional material, CAT)
export class Resource {
	constructor({ id, unit_id, lecturer_id, type, title, file_path, metadata }) {
		this.id = id;
		this.unit_id = unit_id;
		this.lecturer_id = lecturer_id;
		this.type = type;
		this.title = title;
		this.file_path = file_path;
		this.metadata = metadata;
	}
}
