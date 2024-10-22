import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String },
    walletAddress: { type: String, required: true, unique: true },
    username: { type: String },
    photo: { type: String },
    coverPhoto: { type: String },
  },
  { timestamps: true }
);

const User = models.User || model("User", userSchema);

export default User;
