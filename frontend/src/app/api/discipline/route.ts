import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import DisciplineRecord from "@/models/DisciplineRecord"
import Teacher from "@/models/Teacher"
import Student from "@/models/Student"
import Parent from "@/models/Parent"

// GET /api/discipline?studentId=...
//  - PARENT       → records for their own child (studentId required)
//  - TEACHER/ADMIN → records across their school (optionally filtered by studentId)
//  - SUPER_ADMIN  → any
export async function GET(req: NextRequest) {
  const { error, session } = await requireRole(
    UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.PARENT, UserRole.SUPER_ADMIN
  )
  if (error) return error
  await connectDB()

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")

  const filter: Record<string, unknown> = {}

  if (session!.user.role === UserRole.PARENT) {
    if (!studentId) return err("studentId is required for parent queries", 400)
    const parent = await Parent.findOne({ userId: session!.user.id }).lean()
    if (!parent || !parent.studentIds.map(String).includes(studentId)) {
      return err("Forbidden", 403)
    }
    filter.studentId = studentId
  } else if (
    session!.user.role === UserRole.TEACHER ||
    session!.user.role === UserRole.SCHOOL_ADMIN
  ) {
    if (!session!.user.schoolId) return err("No school associated with this account", 400)
    filter.schoolId = session!.user.schoolId
    if (studentId) filter.studentId = studentId
  } else if (studentId) {
    filter.studentId = studentId
  }

  const records = await DisciplineRecord.find(filter)
    .populate("studentId", "firstName lastName")
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .sort({ date: -1 })
    .lean()

  return ok(records)
}

// POST /api/discipline — a teacher records a merit/demerit for a student
export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.TEACHER)
  if (error) return error
  await connectDB()

  const { studentId, type, category, points, note, date, actionTaken } = (await req.json()) as {
    studentId?: string
    type?: string
    category?: string
    points?: number
    note?: string
    date?: string
    actionTaken?: string
  }

  if (!studentId) return err("studentId is required")
  if (type !== "Merit" && type !== "Demerit") return err("type must be 'Merit' or 'Demerit'")
  if (!category || !category.trim()) return err("category is required")
  if (typeof points !== "number" || isNaN(points) || points <= 0) {
    return err("points must be a positive number")
  }

  const teacher = await Teacher.findOne({ userId: session!.user.id }).lean()
  if (!teacher) return err("Teacher record not found", 404)

  const student = await Student.findOne({ _id: studentId, schoolId: teacher.schoolId }).select("_id").lean()
  if (!student) return err("Student not found in this school", 404)

  // Store points signed by type so the sum reflects net conduct.
  const signedPoints = type === "Merit" ? Math.abs(points) : -Math.abs(points)

  const record = await DisciplineRecord.create({
    studentId,
    schoolId: teacher.schoolId,
    teacherId: teacher._id,
    type,
    category: category.trim(),
    points: signedPoints,
    note: note?.trim() || undefined,
    actionTaken: actionTaken?.trim() || undefined,
    date: date ? new Date(date) : undefined,
  })

  return ok(
    await DisciplineRecord.findById(record._id)
      .populate("studentId", "firstName lastName")
      .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
      .lean(),
    201
  )
}
