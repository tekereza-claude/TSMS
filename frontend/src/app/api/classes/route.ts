import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Class from "@/models/Class"
import Student from "@/models/Student"
import Teacher from "@/models/Teacher"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET() {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()
  const filter: Record<string, unknown> = session!.user.schoolId ? { schoolId: session!.user.schoolId } : {}
  // A teacher only sees the classes assigned to them.
  if (session!.user.role === UserRole.TEACHER) {
    const teacher = await Teacher.findOne({ userId: session!.user.id }).select("_id").lean()
    filter.teacherId = teacher?._id ?? null
  }
  const classes = await Class.find(filter)
    .populate("teacherId", "userId")
    .sort({ grade: 1, name: 1 }).lean()

  const withCounts = await Promise.all(
    classes.map(async (c) => {
      const count = await Student.countDocuments({ classId: c._id })
      return { ...c, studentCount: count }
    })
  )
  return ok(withCounts)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { name, grade, teacherId } = await req.json()
  if (!name || !grade) return err("name and grade are required")
  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)
  const cls = await Class.create({ name, grade, schoolId, teacherId: teacherId || undefined })
  return ok(cls, 201)
}
