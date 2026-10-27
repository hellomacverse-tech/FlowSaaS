import { z } from "zod";

export const connectInstanceSchema = z.object({
  label: z.string().trim().min(1).max(80),
  baseUrl: z.string().trim().url(),
  apiKey: z.string().trim().min(10).max(500),
});
export type ConnectInstanceRequest = z.infer<typeof connectInstanceSchema>;

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
});
