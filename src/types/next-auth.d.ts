import { DefaultSession } from "next-auth"
import { UserRole } from "./index"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      schoolId?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    schoolId?: string
  }

  interface JWT {
    role: UserRole
    schoolId?: string
  }
}
