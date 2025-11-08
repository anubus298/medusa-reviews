import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { BulkCreateProductReviewsSchema } from "./middlewares";
import { bulkCreateProductReviewsWorkflow } from "../../../../workflows/bulk-create-product-reviews";

export const POST = async (
  req: AuthenticatedMedusaRequest<BulkCreateProductReviewsSchema>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { reviews } = req.validatedBody;

  const { result: productReviews } = await bulkCreateProductReviewsWorkflow(
    req.scope
  ).run({
    input: { reviews },
  });

  const createdReviewIds = productReviews.map((review) => review.id);

  const { data: product_reviews } = await query.graph(
    {
      entity: "product_review",
      fields: [
        "id",
        "status",
        "product_id",
        "rating",
        "name",
        "content",
        "created_at",
        "updated_at",
        "response.*",
        "images.*",
        "product.*",
      ],
      filters: {
        id: createdReviewIds,
      },
    },
    { cache: { enable: true } }
  );

  res.status(201).json({
    product_reviews,
    count: product_reviews.length,
  });
};
