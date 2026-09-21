import mongoose, { Schema, Model } from "mongoose";
import { IShop } from "@/types/shop";

const ShopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    currency: { type: String, default: "USD" },
    currencySymbol: { type: String, default: "$" },
    village: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    addressLine: { type: String, trim: true, default: "" },
    receiptHeader: { type: String, default: "Thank you for shopping with us!" },
    receiptFooter: { type: String, default: "Goods sold are eligible for return within 7 days." },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Shop: Model<IShop> =
  mongoose.models.Shop || mongoose.model<IShop>("Shop", ShopSchema);