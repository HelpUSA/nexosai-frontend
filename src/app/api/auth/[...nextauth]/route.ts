// NextAuth.js v5 - Google OAuth Configuration

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
 providers: [
 Google({
 clientId: process.env.GOOGLE_CLIENT_ID || "",
 clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
 authorization: {
 params: {
 prompt: "consent",
 access_type: "offline",
 response_type: "code",
 },
 },
 }),
 ],
 callbacks: {
 async signIn({ user, account, profile }) {
 // Only allow specific email during initial setup
 const allowedEmails = ["helpus.ecommerce@gmail.com"];
 if (allowedEmails.includes(user.email || "")) {
 return true;
 }
 // For now, only allow the admin email
 return user.email === "helpus.ecommerce@gmail.com";
 },
 async jwt({ token, account, profile }) {
 if (account) {
 token.accessToken = account.access_token;
 }
 return token;
 },
 async session({ session, token }) {
 return session;
 },
 },
 pages: {
 signIn: "/",
 error: "/",
 },
 secret: process.env.AUTH_SECRET || "nexosai-dev-secret-change-in-production",
});

export const GET = handlers.GET;
export const POST = handlers.POST;
