import Student from "@/models/Student"

// Excludes visually ambiguous characters (0/O, 1/I/L) since this code is handed to parents on paper.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

function randomCode(len = 8) {
  return Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("")
}

export async function generateAdmissionCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const existing = await Student.findOne({ admissionCode: code }).select("_id").lean()
    if (!existing) return code
  }
  throw new Error("Could not generate a unique admission code, please try again")
}
