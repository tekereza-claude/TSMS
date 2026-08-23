import { UserRole } from "@/types"
import Teacher from "@/models/Teacher"
import Parent from "@/models/Parent"
import Student from "@/models/Student"

// Resolves the school a PARENT or TEACHER belongs to (SCHOOL_ADMIN already has
// schoolId on their session — this is only needed for the other two roles).
export async function resolveOwnSchoolId(role: UserRole, userId: string) {
  if (role === UserRole.TEACHER) {
    const teacher = await Teacher.findOne({ userId }).select("schoolId").lean()
    return teacher?.schoolId ?? null
  }
  // PARENT — derive from their first linked child
  const parent = await Parent.findOne({ userId }).select("studentIds").lean()
  if (!parent?.studentIds?.length) return null
  const child = await Student.findById(parent.studentIds[0]).select("schoolId").lean()
  return child?.schoolId ?? null
}
