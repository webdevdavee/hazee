import { Schema, model, models } from "mongoose";

const networkSchema = new Schema({
  chainId: { type: Number, required: true },
  name: { type: String, required: true },
});

const userSchema = new Schema(
  {
    email: { type: String },
    walletAddress: { type: String, required: true, unique: true },
    username: { type: String },
    photo: { type: String },
    coverPhoto: { type: String },
    balance: { type: String },
    network: networkSchema,
  },
  { timestamps: true }
);

const User = models.User || model("User", userSchema);

export default User;
