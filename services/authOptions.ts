import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "./dbConnect";
import { User } from "@/models/User";
import { Shop } from "@/models/Shop";

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
          throw new Error("Email and password are required.");
        }

        await dbConnect();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          throw new Error("No user found with this email.");
        }

        if (!user.isActive) {
          throw new Error("Your account is deactivated. Contact store owner.");
        }

        if (!user.password) {
          throw new Error("User account has no password configured.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password.");
        }

        const shop = await Shop.findById(user.shopId).select("name").lean();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          shopId: user.shopId.toString(),
          shopName: shop?.name || "Grocery Store",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.shopId = user.shopId;
        token.shopName = user.shopName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.shopId = token.shopId;
        session.user.shopName = token.shopName;
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