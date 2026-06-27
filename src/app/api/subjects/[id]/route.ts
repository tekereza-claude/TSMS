import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Subject from "@/models/Subject"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  const { name, code, teacherId } = await req.json()
  const subject = await Subject.findByIdAndUpdate(
    id,
    { name, code, teacherId: teacherId || null },
    { new: true }
  ).lean()
  if (!subject) return err("Subject not found", 404)
  return ok(subject)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  await Subject.findByIdAndDelete(id)
  return ok({ message: "Subject deleted" })
}
