import {
  type MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { createOperatorMap } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";
import { paginationSchema } from "../../utils/schemas";

export const listStoreProductReviewStatsQuerySchema = paginationSchema.extend({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  product_id: z.union([z.string(), z.array(z.string())]).optional(),
  average_rating: z
    .union([z.number().max(5).min(1), z.array(z.number().max(5).min(1))])
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const defaultStoreProductReviewStatFields = [
  "id",
  "product_id",
  "average_rating",
  "review_count",
  "rating_count_1",
  "rating_count_2",
  "rating_count_3",
  "rating_count_4",
  "rating_count_5",
  "created_at",
  "updated_at",
];

export const defaultStoreProductReviewStatsQueryConfig = {
  defaults: [...defaultStoreProductReviewStatFields],
  defaultLimit: 50,
  isList: true,
};

export const storeProductReviewStatRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/product-review-stats",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(
        listStoreProductReviewStatsQuerySchema,
        defaultStoreProductReviewStatsQueryConfig
      ),
    ],
  },
];
