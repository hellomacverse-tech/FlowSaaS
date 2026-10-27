import { z } from "zod";

export const toolRunRequestSchema = z.object({
  input: z.record(z.unknown()),
});
export const publicToolRunRequestSchema = z.object({
  tool: z.string().min(1),
  input: z.record(z.unknown()),
});
