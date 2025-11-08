import {
  Button,
  FocusModal,
  Input,
  Label,
  Select,
  Textarea,
  toast,
} from "@medusajs/ui";
import { Plus, Trash } from "@medusajs/icons";
import { useAdminBulkCreateProductReviewsMutation } from "../hooks/product-review";
import { AdminOrderLineItem } from "@medusajs/framework/types";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const imageSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

const reviewFormSchema = z.object({
  product_id: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  content: z.string().min(1, "Review content is required"),
  status: z.enum(["pending", "approved", "flagged"]),
  images: z.array(imageSchema).default([]),
});

const formSchema = z.object({
  reviews: z.array(reviewFormSchema).min(1, "At least one review is required"),
});

type FormData = z.infer<typeof formSchema>;
type ReviewFormData = z.infer<typeof reviewFormSchema>;

const defaultReview: ReviewFormData = {
  product_id: "",
  username: "",
  rating: 5,
  content: "",
  status: "approved",
  images: [],
};

export const CreateProductReviewDialog = ({
  open,
  setOpen,
  product_id,
  order_id,
  order_items,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  product_id?: string;
  order_id?: string;
  order_items?: AdminOrderLineItem[];
}) => {
  const { mutate: bulkCreate, isPending } =
    useAdminBulkCreateProductReviewsMutation();

  // Create dynamic schema based on whether product selection is required
  const getDynamicSchema = () => {
    if (!product_id && order_items && order_items.length > 0) {
      // Product selection is required
      return z.object({
        reviews: z
          .array(
            reviewFormSchema.extend({
              product_id: z.string().min(1, "Please select a product"),
            })
          )
          .min(1, "At least one review is required"),
      });
    }
    return formSchema;
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getDynamicSchema()),
    defaultValues: {
      reviews: [{ ...defaultReview }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "reviews",
  });

  const onSubmit = (data: FormData) => {
    // Add product_id and/or order_id to each review based on what's provided
    const reviewsWithIds = data.reviews.map((r) => ({
      ...r,
      product_id: product_id || r.product_id,
      ...(order_id && { order_id }),
    }));

    bulkCreate(
      { reviews: reviewsWithIds },
      {
        onSuccess: () => {
          toast.success("Success", {
            description: `${data.reviews.length} review(s) created successfully`,
          });
          reset({ reviews: [{ ...defaultReview }] });
          setOpen(false);
        },
        onError: (error: any) => {
          toast.error("Error", {
            description: error?.message || "Failed to create reviews",
          });
        },
      }
    );
  };

  return (
    <FocusModal open={open} onOpenChange={setOpen}>
      <FocusModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FocusModal.Body className="flex flex-col mt-16 w-[720px] max-w-[100%] px-4 md:p-0 gap-y-4">
            {fields.map((field, index) => (
              <ReviewFormField
                key={field.id}
                index={index}
                register={register}
                control={control}
                watch={watch}
                errors={errors}
                onRemove={() => {
                  if (fields.length > 1) remove(index);
                }}
                canRemove={fields.length > 1}
                showProductSelect={!product_id && !!order_items}
                order_items={order_items}
              />
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ ...defaultReview })}
              className="w-fit"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Review
            </Button>
          </FocusModal.Body>

          <FocusModal.Footer>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Creating..."
                  : `Create ${fields.length} Review(s)`}
              </Button>
            </div>
          </FocusModal.Footer>
        </form>
      </FocusModal.Content>
    </FocusModal>
  );
};

const ReviewFormField = ({
  index,
  register,
  control,
  watch,
  errors,
  onRemove,
  canRemove,
  showProductSelect,
  order_items,
}: {
  index: number;
  register: any;
  control: any;
  watch: any;
  errors: any;
  onRemove: () => void;
  canRemove: boolean;
  showProductSelect?: boolean;
  order_items?: AdminOrderLineItem[];
}) => {
  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: `reviews.${index}.images` as const,
  });

  const rating = watch(`reviews.${index}.rating`);
  const status = watch(`reviews.${index}.status`);
  const selectedProductId = watch(`reviews.${index}.product_id`);

  return (
    <div className="border rounded-lg p-4 space-y-4 relative">
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        >
          <Trash className="h-5 w-5" />
        </button>
      )}

      <h3 className="font-medium text-gray-700">Review #{index + 1}</h3>

      {showProductSelect && order_items && order_items.length > 0 && (
        <div className="mb-4">
          <Label htmlFor={`product_${index}`}>
            Select Product <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedProductId || ""}
            onValueChange={(value) => {
              const event = {
                target: { value, name: `reviews.${index}.product_id` },
              };
              register(`reviews.${index}.product_id`).onChange(event);
            }}
          >
            <Select.Trigger id={`product_${index}`}>
              <Select.Value placeholder="Select a product" />
            </Select.Trigger>
            <Select.Content>
              {order_items.map((item) => (
                <Select.Item key={item.id} value={item.product_id || ""}>
                  <div className="flex items-center gap-2">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.product_title || "Product"}
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                    <span className="line-clamp-1">
                      {item.product_title ||
                        item.variant_title ||
                        "Unknown Product"}
                    </span>
                  </div>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <input type="hidden" {...register(`reviews.${index}.product_id`)} />
          {errors?.reviews?.[index]?.product_id && (
            <span className="text-xs text-red-500">
              {errors.reviews[index].product_id.message}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`username_${index}`}>
            Username <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`username_${index}`}
            {...register(`reviews.${index}.username`)}
            placeholder="John Doe"
          />
          {errors?.reviews?.[index]?.username && (
            <span className="text-xs text-red-500">
              {errors.reviews[index].username.message}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor={`rating_${index}`}>
            Rating <span className="text-red-500">*</span>
          </Label>
          <Select
            value={rating?.toString() || "5"}
            onValueChange={(value) => {
              const event = {
                target: {
                  value: parseInt(value),
                  name: `reviews.${index}.rating`,
                },
              };
              register(`reviews.${index}.rating`).onChange(event);
            }}
          >
            <Select.Trigger id={`rating_${index}`}>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {[1, 2, 3, 4, 5].map((ratingValue) => (
                <Select.Item key={ratingValue} value={ratingValue.toString()}>
                  {ratingValue} Star{ratingValue > 1 ? "s" : ""}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <input type="hidden" {...register(`reviews.${index}.rating`)} />
          {errors?.reviews?.[index]?.rating && (
            <span className="text-xs text-red-500">
              {errors.reviews[index].rating.message}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor={`status_${index}`}>Status</Label>
          <Select
            value={status || "approved"}
            onValueChange={(value) => {
              const event = {
                target: { value, name: `reviews.${index}.status` },
              };
              register(`reviews.${index}.status`).onChange(event);
            }}
          >
            <Select.Trigger id={`status_${index}`}>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="approved">Approved</Select.Item>
              <Select.Item value="pending">Pending</Select.Item>
              <Select.Item value="flagged">Flagged</Select.Item>
            </Select.Content>
          </Select>
          <input type="hidden" {...register(`reviews.${index}.status`)} />
        </div>
      </div>

      <div>
        <Label htmlFor={`content_${index}`}>
          Review Content <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id={`content_${index}`}
          {...register(`reviews.${index}.content`)}
          placeholder="Write the review content..."
          rows={3}
        />
        {errors?.reviews?.[index]?.content && (
          <span className="text-xs text-red-500">
            {errors.reviews[index].content.message}
          </span>
        )}
      </div>

      <div>
        <Label>Images (URLs)</Label>
        <div className="space-y-2">
          {imageFields.map((imageField, imgIndex) => (
            <div key={imageField.id} className="flex gap-2 items-center">
              <Input
                {...register(`reviews.${index}.images.${imgIndex}.url`)}
                disabled
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => removeImage(imgIndex)}
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              id={`image_url_input_${index}`}
              placeholder="https://example.com/image.jpg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value;
                  if (value.trim()) {
                    appendImage({ url: value });
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => {
                const input = document.getElementById(
                  `image_url_input_${index}`
                ) as HTMLInputElement;
                if (input.value.trim()) {
                  appendImage({ url: input.value });
                  input.value = "";
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
