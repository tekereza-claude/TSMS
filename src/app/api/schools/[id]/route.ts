import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import School from "@/models/School"
import SchoolAdmin from "@/models/SchoolAdmin"
import User from "@/models/User"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { hashPassword } from "@/lib/password"
import { sendMail, credentialsEmail, approvedNoCredentialsEmail, applicationRejectedEmail } from "@/lib/mailer"

function randomPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!"
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

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

  const before = await School.findById(id).lean()
  if (!before) return err("School not found", 404)

  const school = await School.findByIdAndUpdate(id, body, { new: true }).lean()
  if (!school) return err("School not found", 404)

  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/signin`
  const justApproved = before.status !== "APPROVED" && school.status === "APPROVED"
  const justRejected = before.status !== "REJECTED" && school.status === "REJECTED"

  if (justApproved) {
    const existingAdmin = await SchoolAdmin.findOne({ schoolId: school._id }).lean()

    if (!existingAdmin) {
      // Manually-added school with no admin yet — create one and email the generated credentials.
      const plainPassword = randomPassword()
      const adminName = `${school.name} Admin`
      const adminEmail = school.email.toLowerCase()

      const existingUser = await User.findOne({ email: adminEmail }).lean()
      let user = existingUser
      if (!user) {
        user = await User.create({
          name: adminName,
          email: adminEmail,
          password: await hashPassword(plainPassword),
          role: UserRole.SCHOOL_ADMIN,
        })
      }

      await SchoolAdmin.create({ userId: user._id, schoolId: school._id })

      try {
        await sendMail(
          adminEmail,
          `Your TSMS School Admin Account — ${school.name}`,
          credentialsEmail({
            schoolName: school.name,
            adminName,
            email: adminEmail,
            password: plainPassword,
            loginUrl,
          })
        )
      } catch (mailErr) {
        // Email failure is non-fatal — admin account is still created
        console.error("[mailer] Failed to send credentials email:", mailErr)
      }
    } else {
      // Self-applied school — the admin already chose their own password, just let them know they can sign in.
      const adminUser = await User.findById(existingAdmin.userId).select("email").lean()
      if (adminUser) {
        try {
          await sendMail(
            adminUser.email,
            `${school.name} has been approved on TSMS`,
            approvedNoCredentialsEmail({
              title: `Your application for ${school.name} has been approved. You can now sign in with the email and password you chose.`,
              loginUrl,
            })
          )
        } catch (mailErr) {
          console.error("[mailer] Failed to send approval email:", mailErr)
        }
      }
    }
  }

  if (justRejected) {
    try {
      await sendMail(
        school.email,
        `Your TSMS application for ${school.name} was not approved`,
        applicationRejectedEmail({
          title: `Your application to register ${school.name} on TSMS was not approved. Please contact the platform administrator for more information.`,
        })
      )
    } catch (mailErr) {
      console.error("[mailer] Failed to send rejection email:", mailErr)
    }
  }

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
