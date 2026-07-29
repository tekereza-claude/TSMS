import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import Parent from "@/models/Parent"
import Student from "@/models/Student"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { sendMail, approvedNoCredentialsEmail, applicationRejectedEmail } from "@/lib/mailer"
import { notifyUser } from "@/lib/notify"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { id } = await params
  const { status } = await req.json()
  if (status !== "APPROVED" && status !== "REJECTED") return err("status must be APPROVED or REJECTED")

  const parent = await Parent.findById(id)
  if (!parent) return err("Parent not found", 404)

  // Scope: only allow acting on parents linked to at least one student in this admin's school.
  const schoolStudents = await Student.find({ schoolId: session!.user.schoolId }).select("_id").lean()
  const schoolStudentIds = new Set(schoolStudents.map((s) => s._id.toString()))
  const belongsToSchool = parent.studentIds.some((sid) => schoolStudentIds.has(sid.toString()))
  if (!belongsToSchool) return err("Parent not found", 404)

  parent.status = status
  await parent.save()

  const user = await User.findById(parent.userId).select("email").lean()
  if (user) {
    const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/signin`
    try {
      if (status === "APPROVED") {
        await sendMail(
          user.email,
          "Your TSMS parent account has been approved",
          approvedNoCredentialsEmail({
            title: "Your parent account application has been approved. You can now sign in with the email and password you chose.",
            loginUrl,
          })
        )
      } else {
        await sendMail(
          user.email,
          "Your TSMS parent application update",
          applicationRejectedEmail({
            title: "Your parent account application was not approved. Please contact your school administrator for more information.",
          })
        )
      }
    } catch (mailErr) {
      console.error("[mailer] Failed to send parent status email:", mailErr)
    }

    await notifyUser(user._id, {
      title: status === "APPROVED" ? "Application approved" : "Application update",
      body: status === "APPROVED"
        ? "Your parent account application has been approved. You can now sign in."
        : "Your parent account application was not approved. Please contact your school administrator.",
    })
  }

  const updated = await Parent.findById(id)
    .populate("userId", "name email createdAt")
    .populate("studentIds", "firstName lastName")
    .lean()
  return ok(updated)
}

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
