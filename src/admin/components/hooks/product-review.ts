import {
  AdminCreateProductReviewResponseDTO,
  AdminListProductReviewsQuery,
  AdminListProductReviewsResponse,
  AdminUpdateProductReviewResponseDTO,
} from "@lambdacurry/medusa-plugins-sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk, backendUrl } from "../../sdk";

const QUERY_KEY = ["product-reviews"];

export const useAdminListProductReviews = (
  query: AdminListProductReviewsQuery
) => {
  return useQuery<
    AdminListProductReviewsResponse,
    AdminListProductReviewsQuery
  >({
    queryKey: [...QUERY_KEY, query],
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      return sdk.admin.productReviews.list(query);
    },
  });
};

export const useAdminCreateProductReviewResponseMutation = (
  reviewId: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminCreateProductReviewResponseDTO) => {
      return await sdk.admin.productReviews.createResponse(reviewId, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useAdminUpdateProductReviewResponseMutation = (
  reviewId: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminUpdateProductReviewResponseDTO) => {
      return await sdk.admin.productReviews.updateResponse(reviewId, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useAdminUpdateProductReviewStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reviewId,
      status,
    }: {
      reviewId: string;
      status: "pending" | "approved" | "flagged";
    }) => {
      return await sdk.admin.productReviews.updateStatus(reviewId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useAdminBulkCreateProductReviewsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      reviews: {
        product_id?: string;
        order_id?: string;
        username: string;
        rating: number;
        content: string;
        images?: { url: string }[];
        status?: "pending" | "approved" | "flagged";
      }[];
    }) => {
      const response = await fetch(`${backendUrl}/admin/product-reviews/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};
