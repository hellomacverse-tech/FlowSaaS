import { z } from "zod";
import { MAX_SANDBOX_INPUT } from "@/lib/pii";

export const sandboxRunRequestSchema = z.object({
  workflowSlug: z.string().min(1),
  input: z.string().min(1).max(MAX_SANDBOX_INPUT),
  turnstileToken: z.string().min(1),
});
export type SandboxRunRequest = z.infer<typeof sandboxRunRequestSchema>;
