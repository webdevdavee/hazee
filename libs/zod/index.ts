import { z } from "zod";

export const searchSchema = z.object({
  query: z.string(),
});

export type TSearchSchema = z.infer<typeof searchSchema>;
