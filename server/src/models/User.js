import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    role: {
      type: String,
      enum: [
        "admin",
        "revenue_officer",
        "surveyor",
        "sro",
        "bank",
        "court",
        "citizen"
      ],
      default: "citizen"
    },
    department: { type: String, default: "" },
    designation: { type: String, default: "" },
    jurisdiction: { type: String, default: "National / Multi-State" },
    passwordHash: { type: String, default: "" },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Pre-save hook: Hash passwordHash if modified and not already hashed
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) {
    return next();
  }

  // Prevent double hashing if string is already a valid bcrypt hash
  if (this.passwordHash.startsWith("$2a$") || this.passwordHash.startsWith("$2b$")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to safely compare a candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Safe JSON serialization (strip passwordHash)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model("User", userSchema);

