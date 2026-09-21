import mongoose, { Schema, Model } from "mongoose";
import { IUser, UserRole } from "@/types/user";

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["OWNER", "MANAGER", "CASHIER"] as UserRole[],
      default: "CASHIER",
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);