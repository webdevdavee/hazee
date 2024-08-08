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
  supply: z.string().min(3, "Use 3 characters or more"),
  description: z.string().min(3, "Use 3 characters or more").optional(),
});

export type TCreateNFTSchema = z.infer<typeof createNFTSchema>;
