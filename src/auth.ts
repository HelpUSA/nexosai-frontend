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
 return user.email === "helpus.ecommerce@gmail.com";
 },
 },
 secret: process.env.AUTH_SECRET,
});
