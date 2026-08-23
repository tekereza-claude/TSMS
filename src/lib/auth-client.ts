import { signOut } from "next-auth/react"

// next-auth's signOut({ callbackUrl }) resolves the redirect target server-side
// against NEXTAUTH_URL, which can drift from the port the app is actually
// running on (e.g. after changing the dev server port without restarting it).
// Redirecting with a relative path here instead makes the browser resolve it
// against whatever origin the user is actually on, regardless of server config.
export async function signOutToHome() {
  await signOut({ redirect: false })
  window.location.href = "/"
}
