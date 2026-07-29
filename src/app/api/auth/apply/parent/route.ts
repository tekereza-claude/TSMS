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

  const { schoolId, parentName, parentEmail, parentPassword, parentPhone, admissionCodes } = await req.json()

  if (!schoolId) return err("Please select your child's school")
  if (!parentName || !parentEmail || !parentPassword) return err("Your name, email and password are required")
  if (!parentPhone) return err("Phone is required")
  if (parentPassword.length < 8) return err("Password must be at least 8 characters")

  const codes: string[] = Array.isArray(admissionCodes)
    ? admissionCodes.map((c: string) => c.trim().toUpperCase()).filter(Boolean)
    : []
  if (codes.length === 0) return err("At least one admission code is required")

  const school = await School.findById(schoolId).select("status").lean()
  if (!school || school.status !== "APPROVED") return err("School not found", 404)

  const students = await Student.find({ admissionCode: { $in: codes }, schoolId }).select("_id admissionCode").lean()
  if (students.length !== codes.length) {
    const found = new Set(students.map((s) => s.admissionCode))
    const missing = codes.filter((c) => !found.has(c))
    return err(`Admission code(s) not found at this school: ${missing.join(", ")}`, 404)
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
