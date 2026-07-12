import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Student from "@/models/Student"
import Mark from "@/models/Mark"
import Teacher from "@/models/Teacher"
import Class from "@/models/Class"
import Parent from "@/models/Parent"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  if (error) return error
  await connectDB()
  const { id } = await params
  const student = await Student.findById(id).populate("classId", "name grade").lean()
  if (!student) return err("Student not found", 404)

  if (session!.user.role === UserRole.SCHOOL_ADMIN) {
    if (String(student.schoolId) !== String(session!.user.schoolId)) return err("Forbidden", 403)
  } else if (session!.user.role === UserRole.TEACHER) {
    // A teacher may only view students in the classes assigned to them
    const teacher = await Teacher.findOne({ userId: session!.user.id }).select("_id").lean()
    if (!teacher) return err("Teacher record not found", 404)
    const cls = student.classId ? await Class.findOne({ _id: student.classId, teacherId: teacher._id }).select("_id").lean() : null
    if (!cls) return err("Forbidden", 403)
  } else if (session!.user.role === UserRole.PARENT) {
    // A parent may only view their own children
    const parent = await Parent.findOne({ userId: session!.user.id }).select("studentIds").lean()
    if (!parent || !parent.studentIds.map(String).includes(id)) return err("Forbidden", 403)
  }

  const marks = await Mark.find({ studentId: id })
    .populate("subjectId", "name code")
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .sort({ year: -1, term: 1 }).lean()
  return ok({ ...student, marks })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  const { firstName, lastName, email, classId, profilePicture } = await req.json()
  const student = await Student.findByIdAndUpdate(
    id,
    {
      firstName,
      lastName,
      email: email || undefined,        // unique+sparse: omit rather than store null
      classId: classId || null,
      profilePicture: profilePicture || null,
    },
    { new: true }
  ).lean()
  if (!student) return err("Student not found", 404)
  return ok(student)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  await Student.findByIdAndDelete(id)
  return ok({ message: "Student removed" })
}
