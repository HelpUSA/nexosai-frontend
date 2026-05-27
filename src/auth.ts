// NextAuth.js v5 Configuration

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
 providers: [
 Google({
 clientId: process.env.GOOGLE_CLIENT_ID || "",
 clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
 }),
 ],
 callbacks: {
 async signIn({ user }) {
 // Allow only admin email for now
 return user.email === "helpus.ecommerce@gmail.com";
 },
 },
 pages: {
 signIn: "/",
 error: "/",
 },
 secret: process.env.AUTH_SECRET,
});
