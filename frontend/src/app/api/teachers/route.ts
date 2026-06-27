import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import Teacher from "@/models/Teacher"
import Class from "@/models/Class"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { hashPassword } from "@/lib/password"
import { UserRole } from "@/types"

export async function GET() {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()

  const filter = session!.user.schoolId ? { schoolId: session!.user.schoolId } : {}
  const teachers = await Teacher.find(filter).populate("userId", "name email createdAt").lean()

  // Attach classes for each teacher
  const withClasses = await Promise.all(
    teachers.map(async (t) => {
      const classes = await Class.find({ teacherId: t._id }).select("name grade").lean()
      return { ...t, classes }
    })
  )
  return ok(withClasses)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { name, email, password } = await req.json()
  if (!name || !email || !password) return err("name, email and password are required")

  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) return err("A user with this email already exists")

  const hashed = await hashPassword(password)
  const user = await User.create({ name, email, password: hashed, role: "TEACHER" })
  const teacher = await Teacher.create({ userId: user._id, schoolId })

  return ok({ ...teacher.toObject(), user: { _id: user._id, name: user.name, email: user.email } }, 201)
}
