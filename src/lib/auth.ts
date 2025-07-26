import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.visitors_account.findUnique({
          where: { EMAIL_ADDRESS: credentials.email },
        });

        if (!user || !user.PASSWORD) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.PASSWORD
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.VISITORS_ACCOUNT_ID.toString(),
          name: `${user.FIRST_NAME} ${user.LAST_NAME}`,
          email: user.EMAIL_ADDRESS,
          image: user.PIC,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        const user = await prisma.visitors_account.findUnique({
          where: { EMAIL_ADDRESS: session.user.email! },
        });

        if (user) {
          session.user.id = `${user.VISITORS_ACCOUNT_ID}`;
          session.user.name = `${user.FIRST_NAME} ${user.LAST_NAME}`;
          session.user.image = user.PIC;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
