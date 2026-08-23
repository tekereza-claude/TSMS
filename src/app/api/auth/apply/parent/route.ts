import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import School from "@/models/School"
import Student from "@/models/Student"
import User from "@/models/User"
import Parent from "@/models/Parent"
import { ok, err } from "@/lib/api-helpers"
import { hashPassword } from "@/lib/password"

export async function POST(req: NextRequest) {
  await connectDB()

  const { schoolId, parentName, parentEmail, parentPassword, parentPhone, studentIds } = await req.json()

  if (!schoolId) return err("Please select your child's school")
  if (!parentName || !parentEmail || !parentPassword) return err("Your name, email and password are required")
  if (!parentPhone) return err("Phone is required")
  if (parentPassword.length < 8) return err("Password must be at least 8 characters")

  const ids: string[] = Array.isArray(studentIds) ? [...new Set(studentIds.filter(Boolean))] : []
  if (ids.length === 0) return err("Please select at least one child")

  const school = await School.findById(schoolId).select("status").lean()
  if (!school || school.status !== "APPROVED") return err("School not found", 404)

  // Re-verify against race conditions: a student may have been claimed by another
  // application since the picker was loaded.
  const linkedStudentIds = await Parent.distinct("studentIds", { status: { $in: ["PENDING", "APPROVED"] } })
  const linked = new Set(linkedStudentIds.map(String))

  const students = await Student.find({ _id: { $in: ids }, schoolId }).select("_id firstName lastName").lean()
  if (students.length !== ids.length) {
    return err("One or more selected children could not be found at this school", 404)
  }
  const alreadyLinked = students.filter((s) => linked.has(String(s._id)))
  if (alreadyLinked.length > 0) {
    return err(`Already linked to another parent: ${alreadyLinked.map((s) => `${s.firstName} ${s.lastName}`).join(", ")}`, 409)
  }

  const parentEmailLower = parentEmail.toLowerCase()
  const existingUser = await User.findOne({ email: parentEmailLower }).select("_id").lean()
  if (existingUser) return err("A user with this email already exists")

  const user = await User.create({
    name: parentName,
    email: parentEmailLower,
    password: await hashPassword(parentPassword),
    role: "PARENT",
  })

  await Parent.create({
    userId: user._id,
    studentIds: students.map((s) => s._id),
    phone: parentPhone,
    status: "PENDING",
  })

  return ok({ message: "Application submitted. You'll be able to sign in once the school administrator approves it." }, 201)
}
