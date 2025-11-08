import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

export const paginationSchema = createFindParams({ limit: 50, offset: 0 });

export type PaginationSchema = z.infer<typeof paginationSchema>;
