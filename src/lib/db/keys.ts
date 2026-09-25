export const keys = {
  userPk: (userId: string) => `USER#${userId}`,
  userSk: "PROFILE",
  registrationVerificationPk: (userId: string) => `VERIFICATION#${userId}`,
  registrationVerificationSk: "REGISTRATION",
  passwordResetPk: (userId: string) => `PASSWORD_RESET#${userId}`,
  passwordResetSk: "PASSWORD_RESET",
  emailLookupPk: (email: string) => `EMAIL#${email}`,
  emailLookupSk: "USER",
  productPk: "PRODUCTS",
  productSk: (productId: string) => `PRODUCT#${productId}`,
  categoryPk: "CATEGORIES",
  categorySk: (categoryId: string) => `CATEGORY#${categoryId}`,
  cartPk: (userId: string) => `USER#${userId}`,
  cartSk: (productId: string) => `CART#${productId}`,
  wishlistPk: (userId: string) => `USER#${userId}`,
  wishlistSk: (productId: string) => `WISHLIST#${productId}`
};
