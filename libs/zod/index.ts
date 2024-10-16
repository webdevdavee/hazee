import { z } from "zod";

export const searchSchema = z.object({
  query: z.string(),
});

export type TSearchSchema = z.infer<typeof searchSchema>;

export const priceRangeSchema = z.object({
  minPrice: z.string().min(1, "Use 1 characters or more"),
  maxPrice: z.string().min(1, "Use 1 characters or more"),
});

export type TPriceRangeSchema = z.infer<typeof priceRangeSchema>;

export const createNFTSchema = z.object({
  name: z.string().min(3, "Use 3 characters or more"),
  supply: z.string().min(1, "Use 1 characters or more"),
  description: z.string().min(3, "Use 3 characters or more").optional(),
});

export type TCreateNFTSchema = z.infer<typeof createNFTSchema>;

export const traitSchema = z.object({
  type: z.string().min(3, "Use 3 characters or more"),
  value: z.string().min(3, "Use 3 characters or more"),
});

export type TraitSchema = z.infer<typeof traitSchema>;

export const creatCollectionSchema = z.object({
  name: z.string().min(3, "Use 3 characters or more"),
  symbol: z.string().min(2, "Use 2 characters or more"),
  description: z.string().min(3, "Use 3 characters or more").optional(),
});

export type TCreatCollectionSchema = z.infer<typeof creatCollectionSchema>;

export const bidPriceSchema = z.object({
  bid: z.string(),
});

export type TBidPriceSchema = z.infer<typeof bidPriceSchema>;

export const editProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Use 3 characters or more")
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores are allowed"
    )
    .transform((val) => val.toLowerCase()),
  email: z.string().email(),
});

export type TEditProfileSchema = z.infer<typeof editProfileSchema>;
