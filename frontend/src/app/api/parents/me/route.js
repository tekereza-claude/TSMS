"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const api_helpers_1 = require("@/lib/api-helpers");
const mongoose_1 = require("@/lib/mongoose");
const types_1 = require("@/types");
const Parent_1 = __importDefault(require("@/models/Parent"));
const Student_1 = __importDefault(require("@/models/Student"));
const Mark_1 = __importDefault(require("@/models/Mark"));
const Subject_1 = __importDefault(require("@/models/Subject"));
const Teacher_1 = __importDefault(require("@/models/Teacher"));
const User_1 = __importDefault(require("@/models/User"));
const Class_1 = __importDefault(require("@/models/Class"));
const DisciplineRecord_1 = __importDefault(require("@/models/DisciplineRecord"));
const Fee_1 = __importDefault(require("@/models/Fee"));
// GET /api/parents/me — returns the logged-in parent's children + their marks
async function GET() {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.PARENT);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const parent = await Parent_1.default.findOne({ userId: session.user.id }).lean();
    if (!parent)
        return (0, api_helpers_1.err)("Parent record not found", 404);
    // Fetch each child with their class and marks
    const students = await Promise.all(parent.studentIds.map(async (studentId) => {
        const student = await Student_1.default.findById(studentId).lean();
        if (!student)
            return null;
        const cls = student.classId
            ? await Class_1.default.findById(student.classId).select("name grade").lean()
            : null;
        const marks = await Mark_1.default.find({ studentId: student._id })
            .sort({ year: -1, term: 1 })
            .lean();
        const enrichedMarks = await Promise.all(marks.map(async (mark) => {
            const subject = await Subject_1.default.findById(mark.subjectId).select("name code").lean();
            const teacher = await Teacher_1.default.findById(mark.teacherId).lean();
            const teacherUser = teacher
                ? await User_1.default.findById(teacher.userId).select("name").lean()
                : null;
            return { ...mark, subject, teacher: { ...teacher, user: teacherUser } };
        }));
        // Discipline records (with the recording teacher's name) and fee account
        const disciplineRaw = await DisciplineRecord_1.default.find({ studentId: student._id })
            .sort({ date: -1 })
            .lean();
        const discipline = await Promise.all(disciplineRaw.map(async (rec) => {
            const teacher = await Teacher_1.default.findById(rec.teacherId).lean();
            const teacherUser = teacher
                ? await User_1.default.findById(teacher.userId).select("name").lean()
                : null;
            return { ...rec, recordedBy: teacherUser?.name ?? "School" };
        }));
        const fee = await Fee_1.default.findOne({ studentId: student._id }).lean();
        return { ...student, class: cls, marks: enrichedMarks, discipline, fee };
    }));
    return (0, api_helpers_1.ok)({ ...parent, students: students.filter(Boolean) });
}
//# sourceMappingURL=route.js.map