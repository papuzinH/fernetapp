import { z } from "zod";

export const paymentUpdateSchema = z.object({
  payment_id: z.string().uuid(),
  status: z.enum(["pending", "paid"]),
});

export type PaymentUpdateValues = z.infer<typeof paymentUpdateSchema>;
