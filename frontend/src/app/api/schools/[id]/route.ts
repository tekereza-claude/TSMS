import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import School from "@/models/School"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  const school = await School.findById(id).lean()
  if (!school) return err("School not found", 404)
  return ok(school)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  const body = await req.json()
  const school = await School.findByIdAndUpdate(id, body, { new: true }).lean()
  if (!school) return err("School not found", 404)
  return ok(school)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SUPER_ADMIN)
  if (error) return error
  await connectDB()
  const { id } = await params
  await School.findByIdAndDelete(id)
  return ok({ message: "School deleted" })
}
