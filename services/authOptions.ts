import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: {
            shop: { select: { name: true } },
            branch: { select: { id: true, name: true } }, // 👈 Include branch
          },
        });

        if (!user) {
          throw new Error("No user found with this email.");
        }

        if (!user.isActive) {
          throw new Error(
            "Your account has been deactivated. Contact your administrator.",
          );
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) {
          throw new Error("Invalid password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopId: user.shopId,
          shopName: user.shop.name,
          branchId: user.branchId || null,
          branchName: user.branch?.name || null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.shopId = user.shopId;
        token.shopName = user.shopName;
        token.branchId = user.branchId;
        token.branchName = user.branchName;
      }

      // 👈 Updates session immediately when switching branches!

          if (trigger === "update" && session?.branchId) {
      token.branchId = session.branchId;
      token.branchName = session.branchName;
    }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.shopId = token.shopId;
        session.user.shopName = token.shopName;
        session.user.branchId = token.branchId;
        session.user.branchName = token.branchName;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
