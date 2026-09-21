import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { UserRole } from "./user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      shopId: string;
      shopName?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    shopId: string;
    shopName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    shopId: string;
    shopName?: string;
  }
}