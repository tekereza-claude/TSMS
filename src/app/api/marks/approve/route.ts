import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Mark from "@/models/Mark"
import Student from "@/models/Student"
import Subject from "@/models/Subject"
import Class from "@/models/Class"
import Teacher from "@/models/Teacher"
import Parent from "@/models/Parent"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { notifyUser } from "@/lib/notify"

// POST /api/marks/approve — school admin releases a pending batch of marks
// (one class + subject + term/year) so parents can see them.
export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { classId, subjectId, term, year } = await req.json()
  if (!classId || !subjectId || !term || !year) {
    return err("classId, subjectId, term and year are required")
  }

  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)

  const classStudents = await Student.find({ schoolId, classId }).select("_id").lean()
  const studentIds = classStudents.map((s) => s._id)

  const pendingFilter = { studentId: { $in: studentIds }, subjectId, term, year, status: "PENDING" as const }
  const pendingMarks = await Mark.find(pendingFilter).select("studentId teacherId").lean()

  const result = await Mark.updateMany(pendingFilter, { $set: { status: "APPROVED" } })

  if (pendingMarks.length > 0) {
    const approvedStudentIds = [...new Set(pendingMarks.map((m) => m.studentId.toString()))]
    const teacherIds = [...new Set(pendingMarks.map((m) => m.teacherId.toString()))]

    const [subject, cls, teachers, parents] = await Promise.all([
      Subject.findById(subjectId).select("name").lean(),
      Class.findById(classId).select("name").lean(),
      Teacher.find({ _id: { $in: teacherIds } }).select("userId").lean(),
      Parent.find({ studentIds: { $in: approvedStudentIds }, status: "APPROVED" }).select("userId").lean(),
    ])

    const subjectName = subject?.name ?? "a subject"
    const className = cls?.name ?? "their class"

    for (const parent of parents) {
      await notifyUser(parent.userId, {
        title: "New marks released",
        body: `New ${subjectName} marks for ${term} ${year} are now available.`,
      })
    }
    for (const teacher of teachers) {
      await notifyUser(teacher.userId, {
        title: "Marks approved",
        body: `Your ${subjectName} marks for ${className} (${term} ${year}) have been approved.`,
      })
    }
  }

  return ok({ approved: result.modifiedCount })
}
