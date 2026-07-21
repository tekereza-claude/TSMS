import { connectDB } from "@/lib/mongoose"
import Mark from "@/models/Mark"
import Student from "@/models/Student"
import Class from "@/models/Class"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

// GET /api/marks/pending — school admin view of mark batches awaiting approval,
// grouped by class + subject + term + year (mirrors how a teacher uploads them).
export async function GET() {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)

  const schoolStudents = await Student.find({ schoolId }).select("_id classId").lean()
  const classIdByStudent = new Map(schoolStudents.map((s) => [s._id.toString(), s.classId?.toString()]))
  const studentIds = schoolStudents.map((s) => s._id)

  const pendingMarks = await Mark.find({ studentId: { $in: studentIds }, status: "PENDING" })
    .populate("subjectId", "name code")
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .lean()

  const classIds = [...new Set(
    pendingMarks
      .map((m) => classIdByStudent.get(m.studentId.toString()))
      .filter((id): id is string => Boolean(id))
  )]
  const classes = await Class.find({ _id: { $in: classIds } }).select("name grade").lean()
  const classById = new Map(classes.map((c) => [c._id.toString(), c]))

  type Batch = {
    classId: string; className: string; grade: string
    subjectId: string; subjectName: string; subjectCode: string
    teacherName: string; term: string; year: string; count: number
  }
  const batches = new Map<string, Batch>()

  for (const m of pendingMarks) {
    const classId = classIdByStudent.get(m.studentId.toString())
    if (!classId) continue // student has no class assigned — nothing to batch-approve by
    const cls = classById.get(classId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subject = m.subjectId as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teacher = m.teacherId as any
    const key = `${classId}|${subject._id}|${m.term}|${m.year}`
    const existing = batches.get(key)
    if (existing) {
      existing.count += 1
    } else {
      batches.set(key, {
        classId,
        className: cls?.name ?? "Unknown class",
        grade: cls?.grade ?? "",
        subjectId: subject._id.toString(),
        subjectName: subject.name,
        subjectCode: subject.code,
        teacherName: teacher?.userId?.name ?? "Unknown",
        term: m.term,
        year: m.year,
        count: 1,
      })
    }
  }

  return ok([...batches.values()].sort((a, b) => a.className.localeCompare(b.className)))
}
