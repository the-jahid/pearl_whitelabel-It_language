// middleware.ts (Clerk v6)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",              // home
  "/sign-in(.*)",   // sign in
  "/sign-up(.*)",   // sign up
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;      // let public routes through
  await auth.protect();                // protect everything else
});

export const config = {
  matcher: [
    // Skip Next internals & static files; always run for API
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
