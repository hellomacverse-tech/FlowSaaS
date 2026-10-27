import { z } from "zod";

export const deployRequestSchema = z.object({
  workflowId: z.string().uuid(),
  instanceId: z.string().uuid(),
});
