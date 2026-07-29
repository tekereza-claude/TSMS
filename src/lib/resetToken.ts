import crypto from "crypto"

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex")
  return {
    token,
    tokenHash: hashToken(token),
    expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}
