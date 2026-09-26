export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  rating: number;
  stock: number;
  imageUrl: string;
  tags: string[];
  createdAt: string;
};

export type ProductReview = { id: string; productId: string; userId: string; authorName: string; rating: number; comment: string; createdAt: string };

export type UserRole = "admin" | "customer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type RegistrationVerification = {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  codeHash: string;
  attempts: number;
  createdAt: string;
  sentAt: string;
  expiresAt: string;
  expiresAtEpoch: number;
};

export type PasswordResetVerification = {
  userId: string;
  email: string;
  codeHash: string;
  attempts: number;
  createdAt: string;
  sentAt: string;
  expiresAt: string;
  expiresAtEpoch: number;
};

export type CartItem = {
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
  addedAt: string;
};

export type WishlistItem = {
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
};

export type CartSummary = {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
};
