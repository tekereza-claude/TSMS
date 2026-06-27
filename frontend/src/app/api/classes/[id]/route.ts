import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Class from "@/models/Class"
import Student from "@/models/Student"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  if (error) return error
  await connectDB()
  const { id } = await params
  const cls = await Class.findById(id).populate("teacherId").lean()
  if (!cls) return err("Class not found", 404)
  const students = await Student.find({ classId: id }).lean()
  return ok({ ...cls, students })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  const { name, grade, teacherId } = await req.json()
  const cls = await Class.findByIdAndUpdate(id, { name, grade, teacherId }, { new: true }).lean()
  if (!cls) return err("Class not found", 404)
  return ok(cls)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  await Class.findByIdAndDelete(id)
  return ok({ message: "Class deleted" })
}
