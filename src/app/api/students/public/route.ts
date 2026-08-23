import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import School from "@/models/School"
import Student from "@/models/Student"
import Parent from "@/models/Parent"
import "@/models/Class" // registers the Class schema so .populate("classId") resolves
import { ok, err } from "@/lib/api-helpers"

// Public, unauthenticated: lists a school's students who aren't yet linked to a
// parent, for the parent-apply page's "select your child(ren)" step. A student
// whose only link was to a rejected application is still available to select.
export async function GET(req: NextRequest) {
  await connectDB()

  const schoolId = req.nextUrl.searchParams.get("schoolId")
  if (!schoolId) return err("schoolId is required")

  const school = await School.findById(schoolId).select("status").lean()
  if (!school || school.status !== "APPROVED") return err("School not found", 404)

  const linkedStudentIds = await Parent.distinct("studentIds", { status: { $in: ["PENDING", "APPROVED"] } })

  const students = await Student.find({ schoolId, _id: { $nin: linkedStudentIds } })
    .populate("classId", "name grade")
    .select("firstName lastName classId")
    .sort({ firstName: 1, lastName: 1 })
    .lean()

  return ok(students)
}
