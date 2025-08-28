// middleware.ts (Clerk v6)
import { NextResponse } from "next/server"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",              // home
  "/sign-in(.*)",   // sign in
  "/sign-up(.*)",   // sign up
])

// Private route that should send unauthenticated users to "/"
const isOutboundRoute = createRouteMatcher(["/dashboard/outbound(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // Let public routes through
  if (isPublicRoute(req)) return

  // Special rule: for /dashboard/outbound, redirect to home if not logged in
  if (isOutboundRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const url = new URL("/", req.url)
      // optional: keep track of where they came from
      url.searchParams.set("redirectedFrom", req.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // Protect everything else (falls back to your default Clerk behavior)
  await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next internals & static files; always run for API
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
