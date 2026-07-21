import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Mark from "@/models/Mark"
import Student from "@/models/Student"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

// POST /api/marks/approve — school admin releases a pending batch of marks
// (one class + subject + term/year) so parents can see them.
export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { classId, subjectId, term, year } = await req.json()
  if (!classId || !subjectId || !term || !year) {
    return err("classId, subjectId, term and year are required")
  }

  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this admin", 400)

  const classStudents = await Student.find({ schoolId, classId }).select("_id").lean()
  const studentIds = classStudents.map((s) => s._id)

  const result = await Mark.updateMany(
    { studentId: { $in: studentIds }, subjectId, term, year, status: "PENDING" },
    { $set: { status: "APPROVED" } }
  )

  return ok({ approved: result.modifiedCount })
}
