import { z } from "zod";

export const searchSchema = z.object({
  query: z.string(),
});

export type TSearchSchema = z.infer<typeof searchSchema>;

export const priceRangeSchema = z.object({
  minPrice: z.string().min(1, "min of 1 character allowed"),
  maxPrice: z.string().min(1, "min of 1 character allowed"),
});

export type TPriceRangeSchema = z.infer<typeof priceRangeSchema>;
