import mongoose, { Schema, Model } from "mongoose";
import { ICategory } from "@/types/category";

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevents duplicate category names inside the SAME shop
CategorySchema.index({ shopId: 1, name: 1 }, { unique: true });

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);