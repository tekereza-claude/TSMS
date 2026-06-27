import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import Teacher from "@/models/Teacher"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  const teacher = await Teacher.findById(id).populate("userId", "name email createdAt").lean()
  if (!teacher) return err("Teacher not found", 404)
  return ok(teacher)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  const { name, email } = await req.json()
  const teacher = await Teacher.findById(id).lean()
  if (!teacher) return err("Teacher not found", 404)
  const user = await User.findByIdAndUpdate(teacher.userId, { name, email }, { new: true })
    .select("name email").lean()
  return ok(user)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  const teacher = await Teacher.findById(id)
  if (!teacher) return err("Teacher not found", 404)
  await User.findByIdAndDelete(teacher.userId)
  await teacher.deleteOne()
  return ok({ message: "Teacher removed" })
}
