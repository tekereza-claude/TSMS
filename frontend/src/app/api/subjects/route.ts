import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Subject from "@/models/Subject"
import Teacher from "@/models/Teacher"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET() {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()
  const filter: Record<string, unknown> = session!.user.schoolId ? { schoolId: session!.user.schoolId } : {}
  // A teacher only sees the courses (subjects) assigned to them.
  if (session!.user.role === UserRole.TEACHER) {
    const teacher = await Teacher.findOne({ userId: session!.user.id }).select("_id").lean()
    filter.teacherId = teacher?._id ?? null
  }
  const subjects = await Subject.find(filter)
    .populate({ path: "teacherId", populate: { path: "userId", select: "name email" } })
    .sort({ name: 1 })
    .lean()
  return ok(subjects)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { name, code, teacherId } = await req.json()
  if (!name || !code) return err("name and code are required")
  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)
  const existing = await Subject.findOne({ code: code.toUpperCase() })
  if (existing) return err("A subject with this code already exists")
  const subject = await Subject.create({ name, code, schoolId, teacherId: teacherId || undefined })
  return ok(subject, 201)
}
