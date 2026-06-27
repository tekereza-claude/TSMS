import { connectDB } from "@/lib/mongoose"
import { requireRole, ok } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import CareerCluster from "@/models/CareerCluster"

// GET /api/careers — career clusters that drive parent career insights.
// Reference data, readable by any authenticated user.
export async function GET() {
  const { error } = await requireRole(
    UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN
  )
  if (error) return error
  await connectDB()

  const clusters = await CareerCluster.find().sort({ order: 1, title: 1 }).lean()
  return ok(clusters)
}
