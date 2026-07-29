import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import School from "@/models/School"
import SchoolAdmin from "@/models/SchoolAdmin"
import User from "@/models/User"
import { ok, err } from "@/lib/api-helpers"
import { hashPassword } from "@/lib/password"

export async function POST(req: NextRequest) {
  await connectDB()

  const { schoolName, schoolEmail, schoolAddress, schoolPhone, adminName, adminEmail, adminPassword } = await req.json()

  if (!schoolName || !schoolEmail) return err("School name and email are required")
  if (!adminName || !adminEmail || !adminPassword) return err("Your name, email and password are required")
  if (adminPassword.length < 8) return err("Password must be at least 8 characters")

  const schoolEmailLower = schoolEmail.toLowerCase()
  const adminEmailLower = adminEmail.toLowerCase()

  const [existingSchool, existingUser] = await Promise.all([
    School.findOne({ email: schoolEmailLower }).select("_id").lean(),
    User.findOne({ email: adminEmailLower }).select("_id").lean(),
  ])
  if (existingSchool) return err("A school with this email has already applied")
  if (existingUser) return err("A user with this email already exists")

  const school = await School.create({
    name: schoolName,
    email: schoolEmailLower,
    address: schoolAddress || undefined,
    phone: schoolPhone || undefined,
    status: "PENDING",
  })

  const user = await User.create({
    name: adminName,
    email: adminEmailLower,
    password: await hashPassword(adminPassword),
    role: "SCHOOL_ADMIN",
  })

  await SchoolAdmin.create({ userId: user._id, schoolId: school._id })

  return ok({ message: "Application submitted. You'll be able to sign in once a platform administrator approves your school." }, 201)
}
