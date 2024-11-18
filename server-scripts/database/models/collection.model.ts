import { Schema, model, models } from "mongoose";

const collectionSchema = new Schema(
  {
    collectionId: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String },
    coverPhoto: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

const Collection = models.Collection || model("Collection", collectionSchema);

export default Collection;
