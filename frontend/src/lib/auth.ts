import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import * as argon2 from "argon2"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import SchoolAdmin from "@/models/SchoolAdmin"
import Teacher from "@/models/Teacher"
import { UserRole } from "@/types"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()

        const user = await User.findOne({ email: credentials.email.toLowerCase() }).lean()
        if (!user) return null

        const valid = await argon2.verify(user.password, credentials.password)
        if (!valid) return null

        // Resolve schoolId from whichever relation exists
        let schoolId: string | undefined

        if (user.role === "SCHOOL_ADMIN") {
          const sa = await SchoolAdmin.findOne({ userId: user._id }).lean()
          schoolId = sa?.schoolId?.toString()
        } else if (user.role === "TEACHER") {
          const t = await Teacher.findOne({ userId: user._id }).lean()
          schoolId = t?.schoolId?.toString()
        }

        return {
          id:    user._id.toString(),
          email: user.email,
          name:  user.name,
          role:  user.role as UserRole,
          schoolId,
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role     = user.role
        token.schoolId = user.schoolId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id       = token.sub!
        session.user.role     = token.role as UserRole
        session.user.schoolId = token.schoolId as string | undefined
      }
      return session
    },
  },

  pages: { signIn: "/auth/signin" },
}
