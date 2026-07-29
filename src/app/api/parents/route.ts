import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import Parent from "@/models/Parent"
import Student from "@/models/Student"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { hashPassword } from "@/lib/password"
import { UserRole } from "@/types"

export async function GET() {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const schoolStudents = await Student.find({ schoolId: session!.user.schoolId }).select("_id").lean()
  const studentIds = schoolStudents.map((s) => s._id)

  const parents = await Parent.find({ studentIds: { $in: studentIds } })
    .populate("userId", "name email createdAt")
    .populate("studentIds", "firstName lastName")
    .lean()

  return ok(parents)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { name, email, password, phone, studentIds, studentId } = await req.json()
  if (!name || !email || !password) return err("name, email and password are required")
  if (!phone) return err("phone is required")

  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)

  // Accept either a single studentId (legacy) or an array of studentIds (a parent may have several children)
  const requestedStudentIds: string[] = Array.isArray(studentIds)
    ? studentIds
    : studentId ? [studentId] : []

  if (requestedStudentIds.length > 0) {
    const found = await Student.find({ _id: { $in: requestedStudentIds }, schoolId }).select("_id").lean()
    if (found.length !== requestedStudentIds.length) return err("One or more students were not found in this school", 404)
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) return err("A user with this email already exists")

  const hashed = await hashPassword(password)
  const user = await User.create({ name, email, password: hashed, role: "PARENT" })
  const parent = await Parent.create({
    userId: user._id,
    studentIds: requestedStudentIds,
    phone,
    status: "APPROVED",
  })

  return ok(
    await Parent.findById(parent._id)
      .populate("userId", "name email")
      .populate("studentIds", "firstName lastName")
      .lean(),
    201
  )
}
