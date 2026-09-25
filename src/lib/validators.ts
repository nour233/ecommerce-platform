import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must contain at least 8 characters").max(128)
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(80)
});

export const verificationCodeSchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code")
});

export const resendVerificationSchema = z.object({
  email: emailSchema
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

export const passwordResetConfirmSchema = verificationCodeSchema.extend({
  password: z.string().min(8, "Password must contain at least 8 characters").max(128)
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(80),
  email: emailSchema,
  currentPassword: z.string().min(8).max(128).optional()
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8, "Password must contain at least 8 characters").max(128)
});

export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1).max(20)
});

export const updateQuantitySchema = z.object({
  quantity: z.number().int().min(1).max(20)
});

export const wishlistItemSchema = z.object({
  productId: z.string().min(1, "Product is required")
});

export const searchParamsSchema = z.object({
  q: z.string().optional().default(""),
  category: z.string().optional().default("all"),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "rating"]).optional().default("featured")
});

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only");

export const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  description: z.string().trim().min(10).max(1000),
  categoryId: z.string().trim().min(1),
  price: z.coerce.number().min(0).max(1_000_000),
  rating: z.coerce.number().min(0).max(5),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  imageUrl: z.string().trim().url(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20)
});

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  description: z.string().trim().min(5).max(500),
  imageUrl: z.string().trim().url()
});

export const adminUserRoleSchema = z.object({
  role: z.enum(["admin", "customer"])
});
