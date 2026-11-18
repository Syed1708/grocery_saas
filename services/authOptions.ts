// services/authOptions.ts (or lib/auth.ts)
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types";
import {
  getClientIp,
  isRateLimited,
  rateLimitMessage,
  registerFailure,
  resetRateLimit,
} from "@/lib/auth/rate-limit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_EMAIL_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 25;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const email = credentials.email.toLowerCase().trim();
        const ip = getClientIp(req);

        // 🛡️ Brute-force protection: throttle per email and per source IP.
        const emailKey = `login:email:${email}`;
        const ipKey = `login:ip:${ip}`;

        const emailLimit = isRateLimited(emailKey, MAX_EMAIL_ATTEMPTS);
        if (emailLimit.limited) {
          throw new Error(rateLimitMessage(emailLimit.retryAfterMs));
        }
        const ipLimit = isRateLimited(ipKey, MAX_IP_ATTEMPTS);
        if (ipLimit.limited) {
          throw new Error(rateLimitMessage(ipLimit.retryAfterMs));
        }

        const registerFailureFor = () => {
          registerFailure(emailKey, LOGIN_WINDOW_MS);
          registerFailure(ipKey, LOGIN_WINDOW_MS);
        };

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            shop: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
        });

        if (!user) {
          registerFailureFor();
          throw new Error("Invalid email or password.");
        }

        if (!user.isActive) {
          registerFailureFor();
          throw new Error("Your account has been deactivated. Contact your store owner.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          registerFailureFor();
          throw new Error("Invalid email or password.");
        }

        // Successful login clears the email throttle.
        resetRateLimit(emailKey);

        // Branch Resolution Logic:
        // Cashier/Manager -> uses their assigned branch
        // Owner -> uses assigned branch, OR automatically resolves the shop's Main Branch
        let branchId = user.branchId;
        let branchName = user.branch?.name || null;

        if (!branchId && user.role === "OWNER") {
          const mainBranch = await prisma.branch.findFirst({
            where: { shopId: user.shopId, isMain: true },
            select: { id: true, name: true },
          });
          branchId = mainBranch?.id || null;
          branchName = mainBranch?.name || null;
        }

        if (user.role !== "OWNER" && !branchId) {
          throw new Error("Staff account is not assigned to any active branch.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopId: user.shopId,
          shopName: user.shop.name,
          branchId,
          branchName,
          customPermissions: Array.isArray(user.customPermissions) ? (user.customPermissions as string[]) : [],
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Initial Login: Hydrate the JWT token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role as UserRole;
        token.shopId = user.shopId;
        token.shopName = user.shopName;
        token.branchId = user.branchId;
        token.branchName = user.branchName;
        token.customPermissions = user.customPermissions; // 👈 Added
      }

      // 2. Dynamic Branch Switching (Only OWNER can switch branches)
      if (trigger === "update" && session?.branchId) {
        if (token.role === "OWNER" && token.shopId) {
          // 🛡️ Never trust a client-supplied branch id: verify it belongs to this shop
          // and is active before putting it in the JWT.
          const requestedBranch = await prisma.branch.findFirst({
            where: { id: session.branchId, shopId: token.shopId, status: "active" },
            select: { id: true, name: true },
          });

          if (requestedBranch) {
            token.branchId = requestedBranch.id;
            token.branchName = requestedBranch.name;
          } else {
            console.warn(`[RBAC] Ignored invalid branch switch for user ${token.id}.`);
          }
        } else {
          // Silently discard or reject attempt by Cashier/Manager to switch branches
          console.warn(`[RBAC Violation Attempt] User ${token.id} tried to switch branch.`);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.shopId = token.shopId as string;
        session.user.shopName = token.shopName as string;
        session.user.branchId = token.branchId as string | null;
        session.user.branchName = token.branchName as string | null;
        session.user.customPermissions = (token.customPermissions as string[]) || []; 
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};