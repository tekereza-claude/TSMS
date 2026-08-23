import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Mark, { TEST_MAX, EXAM_MAX } from "@/models/Mark"
import Teacher from "@/models/Teacher"
import Student from "@/models/Student"
import Subject from "@/models/Subject"
import Class from "@/models/Class"
import Parent from "@/models/Parent"
import School from "@/models/School"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { availableTerms } from "@/lib/terms"

export async function GET(req: NextRequest) {
  const { error, session } = await requireRole(
    UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.PARENT, UserRole.SUPER_ADMIN
  )
  if (error) return error
  await connectDB()

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  const term      = searchParams.get("term")
  const year      = searchParams.get("year")

  const filter: Record<string, unknown> = {}

  if (session!.user.role === UserRole.PARENT) {
    // Parents can only query their own children, and only ever see marks the school has approved
    if (!studentId) return err("studentId is required for parent queries", 400)
    const parent = await Parent.findOne({ userId: session!.user.id }).lean()
    if (!parent || !parent.studentIds.map(String).includes(studentId)) {
      return err("Forbidden", 403)
    }
    filter.studentId = studentId
    filter.status = "APPROVED"
  } else if (session!.user.role === UserRole.TEACHER) {
    // Teachers can only see marks for students in the classes assigned to them
    const teacher = await Teacher.findOne({ userId: session!.user.id }).select("_id").lean()
    if (!teacher) return err("Teacher record not found", 404)
    const classes = await Class.find({ teacherId: teacher._id }).select("_id").lean()
    const allowedStudents = await Student.find({ classId: { $in: classes.map((c) => c._id) } })
      .select("_id").lean()
    const allowedIds = allowedStudents.map((s) => s._id.toString())
    if (studentId) {
      if (!allowedIds.includes(studentId)) return err("Forbidden", 403)
      filter.studentId = studentId
    } else {
      filter.studentId = { $in: allowedIds }
    }
  } else if (session!.user.role === UserRole.SCHOOL_ADMIN) {
    // School admins can only see marks for students in their own school
    if (!session!.user.schoolId) return err("No school associated with this account", 400)
    const schoolStudents = await Student.find({ schoolId: session!.user.schoolId }).select("_id").lean()
    const allowedIds = schoolStudents.map((s) => s._id.toString())
    if (studentId) {
      if (!allowedIds.includes(studentId)) return err("Forbidden", 403)
      filter.studentId = studentId
    } else {
      filter.studentId = { $in: allowedIds }
    }
  } else if (studentId) {
    // SUPER_ADMIN may optionally filter by studentId with no further restriction
    filter.studentId = studentId
  }

  if (term) filter.term = term
  if (year) filter.year = year

  const marks = await Mark.find(filter)
    .populate("studentId", "firstName lastName")
    .populate("subjectId", "name code")
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .sort({ year: -1, term: 1 }).lean()

  return ok(marks)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.TEACHER)
  if (error) return error
  await connectDB()

  const { records } = await req.json() as {
    records: { studentId: string; subjectId: string; test: number; exam: number; term: string; year: string }[]
  }

  if (!Array.isArray(records) || records.length === 0) {
    return err("records array is required and must not be empty")
  }

  // Validate test/exam components are within their 0–50 bounds
  const outOfRange = records.filter(
    (r) =>
      typeof r.test !== "number" || r.test < 0 || r.test > TEST_MAX ||
      typeof r.exam !== "number" || r.exam < 0 || r.exam > EXAM_MAX
  )
  if (outOfRange.length > 0) {
    return err(`${outOfRange.length} record(s) have a test or exam mark outside the 0–${TEST_MAX}/0–${EXAM_MAX} range`, 422)
  }

  const teacher = await Teacher.findOne({ userId: session!.user.id }).lean()
  if (!teacher) return err("Teacher record not found", 404)

  // A teacher may only submit marks for a term the school has actually opened
  const school = await School.findById(teacher.schoolId).select("currentTerm").lean()
  const openTerms = availableTerms(school?.currentTerm)
  const notOpenYet = records.filter((r) => !openTerms.includes(r.term as (typeof openTerms)[number]))
  if (notOpenYet.length > 0) {
    return err(`${notOpenYet.length} record(s) are for a term not open yet — current term is ${school?.currentTerm ?? "Term 1"}`, 422)
  }

  // A teacher may only submit marks for students in the classes assigned to them
  const classes = await Class.find({ teacherId: teacher._id }).select("_id").lean()

  const studentIds = [...new Set(records.map((r) => r.studentId))]
  const subjectIds = [...new Set(records.map((r) => r.subjectId))]

  const [students, subjects] = await Promise.all([
    Student.find({ _id: { $in: studentIds }, schoolId: teacher.schoolId, classId: { $in: classes.map((c) => c._id) } })
      .select("_id").lean(),
    Subject.find({ _id: { $in: subjectIds }, schoolId: teacher.schoolId }).select("_id").lean(),
  ])

  const validStudentIds = new Set(students.map((s) => s._id.toString()))
  const validSubjectIds = new Set(subjects.map((s) => s._id.toString()))
  const invalid = records.filter((r) => !validStudentIds.has(r.studentId) || !validSubjectIds.has(r.subjectId))

  if (invalid.length > 0) {
    return err(`${invalid.length} record(s) reference students or subjects not assigned to you`, 422)
  }

  // Bulk upsert using updateOne with upsert:true. score = test + exam (out of 100).
  // Newly uploaded/edited marks reset to PENDING — a school admin must approve
  // them again before parents can see the updated values.
  const ops = records.map((r) => ({
    updateOne: {
      filter: { studentId: r.studentId, subjectId: r.subjectId, term: r.term, year: r.year },
      update: { $set: { test: r.test, exam: r.exam, score: r.test + r.exam, maxScore: TEST_MAX + EXAM_MAX, teacherId: teacher._id, status: "PENDING" as const } },
      upsert: true,
    },
  }))

  const result = await Mark.bulkWrite(ops)
  return ok({ saved: result.upsertedCount + result.modifiedCount }, 201)
}
