import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import School from "@/models/School"
import SchoolAdmin from "@/models/SchoolAdmin"
import Subscription from "@/models/Subscription"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET() {
  const { error, session } = await requireRole(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  if (session!.user.role === UserRole.SCHOOL_ADMIN) {
    const sa = await SchoolAdmin.findOne({ userId: session!.user.id }).lean()
    if (!sa) return err("School admin record not found", 404)
    const school = await School.findById(sa.schoolId).lean()
    const sub = await Subscription.findOne({ schoolId: sa.schoolId }).lean()
    return ok({ ...school, subscription: sub })
  }

  const schools = await School.find().sort({ createdAt: -1 }).lean()
  const subs = await Subscription.find().lean()
  const subMap = Object.fromEntries(subs.map((s) => [s.schoolId.toString(), s]))

  return ok(schools.map((s) => ({ ...s, subscription: subMap[s._id.toString()] ?? null })))
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()

  const { name, email, address, phone } = await req.json()
  if (!name || !email) return err("name and email are required")

  const existing = await School.findOne({ email: email.toLowerCase() })
  if (existing) return err("A school with this email already exists")

  const school = await School.create({ name, email, address, phone })
  return ok(school, 201)
}
