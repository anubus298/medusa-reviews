import { StepResponse, createStep } from "@medusajs/workflows-sdk";
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review";
import type ProductReviewService from "../../modules/product-review/service";

export type BulkCreateProductReviewInput = {
  product_id?: string;
  order_id?: string;
  username: string;
  rating: number;
  content: string;
  images?: { url: string }[];
  status?: "pending" | "approved" | "flagged";
};

export const bulkCreateProductReviewsStepId =
  "bulk-create-product-reviews-step";

export const bulkCreateProductReviewsStep = createStep(
  bulkCreateProductReviewsStepId,
  async (data: BulkCreateProductReviewInput[], { container }) => {
    const productReviewService = container.resolve<ProductReviewService>(
      PRODUCT_REVIEW_MODULE
    );

    const images = data.flatMap((productReview, index) =>
      (productReview.images ?? []).map((i) => ({ url: i.url, index }))
    );

    const createData: any[] = data.map((d) => ({
      product_id: d.product_id || null,
      name: d.username,
      email: null, // Anonymous users don't have email
      rating: d.rating,
      content: d.content,
      status: d.status ?? "approved",
      order_id: d.order_id || null,
      order_line_item_id: null,
      images:
        d.images?.map((image) => ({
          url: image.url,
        })) ?? [],
    }));

    const productReviews = await productReviewService.createProductReviews(
      createData
    );

    // Create images if any
    if (images.length > 0) {
      await productReviewService.createProductReviewImages(
        images.map((i) => ({
          product_review_id: productReviews[i.index].id,
          url: i.url,
        }))
      );
    }

    return new StepResponse(productReviews, {
      productReviewIds: productReviews.map((productReview) => productReview.id),
    });
  },
  async (data, { container }) => {
    if (!data) return;

    const { productReviewIds } = data;

    const productReviewService = container.resolve<ProductReviewService>(
      PRODUCT_REVIEW_MODULE
    );

    await productReviewService.deleteProductReviews(productReviewIds);

    await productReviewService.refreshProductReviewStats(productReviewIds);
  }
);
