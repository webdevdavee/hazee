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
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)), "Must be a valid number")
    .refine(
      (val) => parseFloat(val) >= 0,
      "Price must be greater than or equal to 0"
    ),
  description: z.string().min(3, "Use 3 characters or more"),
});

export type TCreateNFTSchema = z.infer<typeof createNFTSchema>;

export const traitSchema = z.object({
  trait_type: z.string().min(1, "Trait type is required"),
  value: z.string().min(1, "Value is required"),
});

export type TraitSchema = z.infer<typeof traitSchema>;

export const createCollectionSchema = z.object({
  name: z.string().min(3, "Use 3 characters or more"),
  royalty: z
    .string()
    .refine((value) => !isNaN(Number(value)), {
      message: "Royalty must be a valid number",
    })
    .transform((value) => Number(value))
    .refine((value) => value <= 40, {
      message: "Royalty cannot be more than 40%",
    })
    .refine((value) => value >= 0, {
      message: "Royalty must be at least 0%",
    }),
  floorPrice: z
    .string()
    .refine((value) => !isNaN(Number(value)), {
      message: "Floor price must be a valid number in ETH",
    })
    .transform((value) => Number(value))
    .refine((value) => value > 0, {
      message: "Floor price must be a positive number",
    }),
  supply: z
    .string()
    .refine((value) => !isNaN(Number(value)), {
      message: "Supply must be a valid number",
    })
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value), {
      message: "Supply must be a whole number",
    })
    .refine((value) => value > 0, {
      message: "Supply must be a positive number",
    }),
  description: z.string().optional(),
});

export type TCreateCollectionSchema = z.infer<typeof createCollectionSchema>;

export const bidPriceSchema = z.object({
  bid: z
    .string()
    .refine((value) => !isNaN(Number(value)), {
      message: "Bid must be a valid number in ETH",
    })
    .transform((value) => Number(value))
    .refine((value) => value > 0, {
      message: "Bid must be a positive number",
    }),
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

export const listNFTSchema = z.object({
  listingPrice: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), "Must be a valid number")
    .refine(
      (val) => parseFloat(val) >= 0,
      "Price must be greater than or equal to 0"
    )
    .optional(),
  startingPrice: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), "Must be a valid number")
    .refine(
      (val) => parseFloat(val) >= 0,
      "Price must be greater than or equal to 0"
    )
    .optional(),
  reservePrice: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), "Must be a valid number")
    .refine(
      (val) => parseFloat(val) >= 0,
      "Price must be greater than or equal to 0"
    )
    .optional(),
});

export type ListNFTSchema = z.infer<typeof listNFTSchema>;

export const makeCollectionOfferSchema = z.object({
  nftCount: z.string().min(1, "Use 1 characters or more"),
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), "Must be a valid number")
    .refine(
      (val) => parseFloat(val) >= 0,
      "Price must be greater than or equal to 0"
    ),
});

export type TMakeCollectionOfferSchema = z.infer<
  typeof makeCollectionOfferSchema
>;
