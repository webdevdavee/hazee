import { Schema, model, models } from "mongoose";

const collectionSchema = new Schema(
  {
    collectionId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String },
    coverPhoto: { type: String },
  },
  { timestamps: true }
);

const Collection = models.Collection || model("Collection", collectionSchema);

export default Collection;
