import { requireRole, ok, err } from "@/lib/api-helpers"
import { connectDB } from "@/lib/mongoose"
import { UserRole } from "@/types"
import Parent from "@/models/Parent"
import Student from "@/models/Student"
import Mark from "@/models/Mark"
import Subject from "@/models/Subject"
import Teacher from "@/models/Teacher"
import User from "@/models/User"
import Class from "@/models/Class"
import DisciplineRecord from "@/models/DisciplineRecord"
import Fee from "@/models/Fee"

// GET /api/parents/me — returns the logged-in parent's children + their marks
export async function GET() {
  const { error, session } = await requireRole(UserRole.PARENT)
  if (error) return error

  await connectDB()

  const parent = await Parent.findOne({ userId: session!.user.id }).lean()
  if (!parent) return err("Parent record not found", 404)

  // Fetch each child with their class and marks
  const students = await Promise.all(
    parent.studentIds.map(async (studentId) => {
      const student = await Student.findById(studentId).lean()
      if (!student) return null

      const cls = student.classId
        ? await Class.findById(student.classId).select("name grade").lean()
        : null

      const marks = await Mark.find({ studentId: student._id })
        .sort({ year: -1, term: 1 })
        .lean()

      const enrichedMarks = await Promise.all(
        marks.map(async (mark) => {
          const subject = await Subject.findById(mark.subjectId).select("name code").lean()
          const teacher = await Teacher.findById(mark.teacherId).lean()
          const teacherUser = teacher
            ? await User.findById(teacher.userId).select("name").lean()
            : null
          return { ...mark, subject, teacher: { ...teacher, user: teacherUser } }
        })
      )

      // Discipline records (with the recording teacher's name) and fee account
      const disciplineRaw = await DisciplineRecord.find({ studentId: student._id })
        .sort({ date: -1 })
        .lean()
      const discipline = await Promise.all(
        disciplineRaw.map(async (rec) => {
          const teacher = await Teacher.findById(rec.teacherId).lean()
          const teacherUser = teacher
            ? await User.findById(teacher.userId).select("name").lean()
            : null
          return { ...rec, recordedBy: teacherUser?.name ?? "School" }
        })
      )

      const fee = await Fee.findOne({ studentId: student._id }).lean()

      return { ...student, class: cls, marks: enrichedMarks, discipline, fee }
    })
  )

  return ok({ ...parent, students: students.filter(Boolean) })
}
