import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import Fee from "@/models/Fee"
import Student from "@/models/Student"
import Parent from "@/models/Parent"

// GET /api/fees?studentId=...
//  - PARENT       → the fee account for their own child (studentId required)
//  - SCHOOL_ADMIN → fee accounts across their school (optionally one student)
//  - SUPER_ADMIN  → any
export async function GET(req: NextRequest) {
  const { error, session } = await requireRole(
    UserRole.SCHOOL_ADMIN, UserRole.PARENT, UserRole.SUPER_ADMIN
  )
  if (error) return error
  await connectDB()

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")

  if (session!.user.role === UserRole.PARENT) {
    if (!studentId) return err("studentId is required for parent queries", 400)
    const parent = await Parent.findOne({ userId: session!.user.id }).lean()
    if (!parent || !parent.studentIds.map(String).includes(studentId)) {
      return err("Forbidden", 403)
    }
    const fee = await Fee.findOne({ studentId }).lean()
    return ok(fee)
  }

  // SCHOOL_ADMIN / SUPER_ADMIN
  const filter: Record<string, unknown> = {}
  if (session!.user.role === UserRole.SCHOOL_ADMIN) {
    if (!session!.user.schoolId) return err("No school associated with this account", 400)
    filter.schoolId = session!.user.schoolId
  }
  if (studentId) {
    filter.studentId = studentId
    const fee = await Fee.findOne(filter).lean()
    return ok(fee)
  }

  const fees = await Fee.find(filter).populate("studentId", "firstName lastName").lean()
  return ok(fees)
}

// POST /api/fees — school admin creates/updates a student's fee account (upsert)
export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { studentId, currency, dueDate, items, paid } = (await req.json()) as {
    studentId?: string
    currency?: string
    dueDate?: string
    items?: { item: string; amount: number; term: string }[]
    paid?: number
  }

  if (!studentId) return err("studentId is required")

  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)

  const student = await Student.findOne({ _id: studentId, schoolId }).select("_id").lean()
  if (!student) return err("Student not found in this school", 404)

  if (items && !Array.isArray(items)) return err("items must be an array")
  const cleanItems = (items ?? [])
    .filter((it) => it && it.item && typeof it.amount === "number")
    .map((it) => ({ item: String(it.item).trim(), amount: Math.max(0, it.amount), term: String(it.term ?? "").trim() }))

  const fee = await Fee.findOneAndUpdate(
    { studentId },
    {
      $set: {
        schoolId,
        currency: currency?.trim() || "RWF",
        dueDate: dueDate || undefined,
        items: cleanItems,
        paid: typeof paid === "number" && paid >= 0 ? paid : 0,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return ok(fee, 201)
}
