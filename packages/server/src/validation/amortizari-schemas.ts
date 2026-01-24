import { z } from "zod";

// POST /amortizari/genereaza request body
export const genereazaAmortizareSchema = z.object({
  an: z.number().int().min(2020).max(2100),
  luna: z.number().int().min(1).max(12),
});

export type GenereazaAmortizareInput = z.infer<typeof genereazaAmortizareSchema>;
