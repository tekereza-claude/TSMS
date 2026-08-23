import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { resolveOwnSchoolId } from "@/lib/school"
import { TERM_ORDER } from "@/lib/terms"
import School from "@/models/School"

async function resolveSchoolId(role: UserRole, userId: string, sessionSchoolId?: string) {
  if (role === UserRole.PARENT) return resolveOwnSchoolId(role, userId)
  return sessionSchoolId ?? null
}

// GET /api/schools/me — the caller's own school (name + current term)
export async function GET() {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  if (error) return error
  await connectDB()

  const schoolId = await resolveSchoolId(session!.user.role, session!.user.id, session!.user.schoolId)
  if (!schoolId) return err("No school could be determined for your account", 400)

  const school = await School.findById(schoolId).select("name currentTerm").lean()
  if (!school) return err("School not found", 404)

  return ok({ _id: school._id, name: school.name, currentTerm: school.currentTerm ?? "Term 1" })
}

// PATCH /api/schools/me — school admin advances (or rolls back) their current term
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this account", 400)

  const { currentTerm } = (await req.json()) as { currentTerm?: string }
  if (!currentTerm || !TERM_ORDER.includes(currentTerm as (typeof TERM_ORDER)[number])) {
    return err(`currentTerm must be one of: ${TERM_ORDER.join(", ")}`)
  }

  const school = await School.findByIdAndUpdate(schoolId, { currentTerm }, { new: true })
    .select("name currentTerm")
    .lean()
  if (!school) return err("School not found", 404)

  return ok({ _id: school._id, name: school.name, currentTerm: school.currentTerm })
}
