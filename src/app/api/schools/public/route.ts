import { connectDB } from "@/lib/mongoose"
import School from "@/models/School"
import { ok } from "@/lib/api-helpers"

// Public, unauthenticated: only exposes approved schools' id + name, for the parent-apply school picker.
export async function GET() {
  await connectDB()
  const schools = await School.find({ status: "APPROVED" }).select("name").sort({ name: 1 }).lean()
  return ok(schools)
}
