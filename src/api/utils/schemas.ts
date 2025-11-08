import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

/**
 * Base pagination schema to replace createFindParams
 * - offset: optional, must be >= 0
 * - limit: optional, must not exceed 60
 */
export const paginationSchema = createFindParams({ limit: 50, offset: 0 });

// z.object({
//   offset: z.coerce.number().int().min(0).optional(),
//   limit: z.coerce.number().int().max(60).optional(),
//   fields: z.string().optional().default("*"),
//   order: z.string().optional(),
// });

export type PaginationSchema = z.infer<typeof paginationSchema>;
