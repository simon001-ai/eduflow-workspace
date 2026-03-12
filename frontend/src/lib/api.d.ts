export declare const fetchUnits: (teachingUnits: string[]) => Promise<any>;
export declare const fetchSubmissions: (teachingUnits: string[], unitId: string) => Promise<any>;
export declare const fetchAssignmentDetails: (assignmentId: string) => Promise<any>;
export declare const submitGrade: (submissionId: string, grade: string, feedback: string) => Promise<any>;