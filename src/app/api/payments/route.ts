import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import Payment from "@/models/Payment"
import School from "@/models/School"

// GET /api/payments?schoolId=... — super admin lists recorded payments
export async function GET(req: NextRequest) {
  const { error } = await requireRole(UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get("schoolId")

  const filter: Record<string, unknown> = {}
  if (schoolId) filter.schoolId = schoolId

  const payments = await Payment.find(filter)
    .populate("schoolId", "name email")
    .sort({ date: -1 })
    .lean()
  return ok(payments)
}

// POST /api/payments — super admin records a payment received from a school
export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()

  const { schoolId, amount, currency, date, method, note } = (await req.json()) as {
    schoolId?: string
    amount?: number
    currency?: string
    date?: string
    method?: string
    note?: string
  }

  if (!schoolId) return err("schoolId is required")
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return err("amount must be a positive number")
  }

  const school = await School.findById(schoolId).select("_id").lean()
  if (!school) return err("School not found", 404)

  const payment = await Payment.create({
    schoolId,
    amount,
    currency: currency?.trim() || "USD",
    date: date ? new Date(date) : undefined,
    method: method?.trim() || undefined,
    note: note?.trim() || undefined,
    recordedBy: session!.user.id,
  })

  return ok(
    await Payment.findById(payment._id).populate("schoolId", "name email").lean(),
    201
  )
}
