
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { UserRole } from "./rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      shopId: string;
      shopName: string;
      role: UserRole;
      branchId: string | null;
      branchName: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    shopId: string;
    shopName: string;
    branchId: string | null;
    branchName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    shopId: string;
    shopName: string;
    branchId: string | null;
    branchName: string | null;
  }
}