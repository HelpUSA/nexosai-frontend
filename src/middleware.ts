// NextAuth Middleware - Protect dashboard routes

export { auth as middleware } from "@/app/api/auth/[...nextauth]/route";

export const config = {
 matcher: ["/dashboard/:path*", "/admin/:path*"],
};
