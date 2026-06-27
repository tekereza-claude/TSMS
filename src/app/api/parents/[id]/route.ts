import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import Parent from "@/models/Parent"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { id } = await params
  const parent = await Parent.findById(id).lean()
  if (!parent) return err("Parent not found", 404)

  await Promise.all([
    Parent.findByIdAndDelete(id),
    User.findByIdAndDelete(parent.userId),
  ])

  return ok({ message: "Parent removed" })
}
