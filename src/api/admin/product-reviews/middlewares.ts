import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createOperatorMap } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";
import { paginationSchema } from "../../utils/schemas";

const statuses = z.enum(["pending", "approved", "rejected"] as const);

// Helper function to validate and process ISO date strings
const preprocessISODate = (val: unknown): unknown => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    // Validate ISO 8601 format
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (!isoRegex.test(trimmed)) {
      throw new Error("Invalid ISO 8601 date format");
    }
    return trimmed;
  }
  if (typeof val === "object" && val !== null) {
    // Handle operator objects like { $gt: "2024-01-01", $lt: "2024-12-31" }
    const processed: any = {};
    for (const [key, value] of Object.entries(val)) {
      if (typeof value === "string") {
        const trimmed = value.trim();
        const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
        if (!isoRegex.test(trimmed)) {
          throw new Error(`Invalid ISO 8601 date format for operator ${key}`);
        }
        processed[key] = trimmed;
      } else {
        processed[key] = value;
      }
    }
    return processed;
  }
  return val;
};

export const GetCustomSchema = paginationSchema;

const schemass = paginationSchema.extend({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([statuses, z.array(statuses)]).optional(),
  product_id: z.union([z.string(), z.array(z.string())]).optional(),
  order_id: z.union([z.string(), z.array(z.string())]).optional(),
  rating: z
    .union([z.number().max(5).min(1), z.array(z.number().max(5).min(1))])
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const defaultAdminProductReviewFields = [
  "id",
  "status",
  "product_id",
  "rating",
  "name",
  "email",
  "content",
  "order_id",
  "created_at",
  "updated_at",
  "response.*",
  "images.*",
  "product.*",
  "order.*",
];

export const defaultProductReviewsQueryConfig = {
  defaults: [...defaultAdminProductReviewFields],
  defaultLimit: 50,
  isList: true,
};

export const adminProductReviewRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/product-reviews",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(schemass, {
        isList: true,
        defaults: [...defaultAdminProductReviewFields],
      }),
    ],
  },
];
