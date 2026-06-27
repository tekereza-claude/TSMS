import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Student from "@/models/Student"
import Class from "@/models/Class"
import Teacher from "@/models/Teacher"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET() {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()
  const filter: Record<string, unknown> = session!.user.schoolId ? { schoolId: session!.user.schoolId } : {}
  // A teacher only sees students in the classes assigned to them.
  if (session!.user.role === UserRole.TEACHER) {
    const teacher = await Teacher.findOne({ userId: session!.user.id }).select("_id").lean()
    const classes = await Class.find({ teacherId: teacher?._id }).select("_id").lean()
    filter.classId = { $in: classes.map((c) => c._id) }
  }
  const students = await Student.find(filter).populate("classId", "name grade").sort({ firstName: 1 }).lean()
  return ok(students)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { firstName, lastName, email, classId, profilePicture } = await req.json()
  if (!firstName || !lastName) return err("firstName and lastName are required")
  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)
  const student = await Student.create({
    firstName,
    lastName,
    email: email || undefined,
    schoolId,
    classId: classId || undefined,
    profilePicture: profilePicture || undefined,
  })
  return ok(student, 201)
}
