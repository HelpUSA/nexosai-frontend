// NextAuth Middleware - Protect dashboard routes

import { auth } from "@/auth";

export default auth;

export const config = {
 matcher: ["/dashboard/:path*", "/admin/:path*"],
};
