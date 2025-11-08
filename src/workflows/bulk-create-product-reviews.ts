import { transform } from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";
import {
  type WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/workflows-sdk";
import { refreshProductReviewStatsWorkflow } from "./refresh-product-review-stats";
import { bulkCreateProductReviewsStep } from "./steps/bulk-create-product-reviews";

export type BulkCreateProductReviewsWorkflowInput = {
  reviews: {
    product_id?: string;
    order_id?: string;
    username: string;
    rating: number;
    content: string;
    images?: { url: string }[];
    status?: "pending" | "approved" | "flagged";
  }[];
};

export const bulkCreateProductReviewsWorkflow = createWorkflow(
  "bulk-create-product-reviews-workflow",
  (input: WorkflowData<BulkCreateProductReviewsWorkflowInput>) => {
    const productReviews = bulkCreateProductReviewsStep(input.reviews);

    const productIds = transform({ productReviews }, ({ productReviews }) => {
      return productReviews
        .map((productReview) => productReview.product_id)
        .filter((p) => p !== null);
    });

    refreshProductReviewStatsWorkflow.runAsStep({
      input: { productIds: productIds },
    });

    const emitData = transform({ productReviews }, ({ productReviews }) => {
      return {
        eventName: "product_review.bulk_created",
        data: productReviews.map((productReview) => ({
          id: productReview.id,
        })),
      };
    });

    emitEventStep(emitData);

    return new WorkflowResponse(productReviews);
  }
);
