import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    role: {
      type: String,
      enum: ["admin", "verifier", "citizen"],
      default: "citizen"
    },
    department: { type: String, default: "" },
    passwordHash: { type: String, default: "" },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

