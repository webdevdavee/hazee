import { Schema, model, models } from "mongoose";

const NftViewSchema = new Schema(
  {
    tokenId: { type: Number, required: true, unique: true },
    viewCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    uniqueViews: {
      type: Schema.Types.Mixed, // This allows for dynamic keys
      default: {},
    },
  },
  {
    strict: false, // Allow dynamic fields
  }
);

const Nftview = models.Nftview || model("Nftview", NftViewSchema);

export default Nftview;
