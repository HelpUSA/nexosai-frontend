import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-client-secret",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return ["helpus.ecommerce@gmail.com", "admin@helpusbr.com"].includes(user.email || "");
    },
  },
  secret: process.env.AUTH_SECRET || "nexosai-secret-key-2026",
});

export { handler as GET, handler as POST };
