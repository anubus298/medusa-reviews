import {
  type MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework";
import { z } from "zod";

export const bulkCreateProductReviewsSchema = z.object({
  reviews: z.array(
    z.object({
      product_id: z.string().optional(),
      order_id: z.string().optional(),
      username: z.string(),
      rating: z.number().max(5).min(1),
      content: z.string(),
      images: z
        .array(z.object({ url: z.string() }))
        .optional()
        .default([]),
      status: z
        .enum(["pending", "approved", "flagged"])
        .optional()
        .default("approved"),
    })
  ),
});

export type BulkCreateProductReviewsSchema = z.infer<
  typeof bulkCreateProductReviewsSchema
>;

export const adminProductReviewBulkRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/product-reviews/bulk",
    method: "POST",
    middlewares: [validateAndTransformBody(bulkCreateProductReviewsSchema)],
  },
];
