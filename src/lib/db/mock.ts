import { categories, demoUser, products } from "@/lib/data/seed";
import { keys } from "@/lib/db/keys";
import type {
  CartItem,
  Category,
  Product,
  RegistrationVerification,
  User,
  WishlistItem
} from "@/types";

export type MockUser = User & {
  passwordHash?: string;
  passwordSalt?: string;
};

type Store = {
  users: MockUser[];
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  wishlist: WishlistItem[];
  registrationVerifications: RegistrationVerification[];
};

const globalForMock = globalThis as unknown as { commerceCraftStore?: Store };

const initialStore: Store = {
    users: [demoUser],
    products,
    categories,
    cart: [],
    wishlist: [],
    registrationVerifications: []
};

export const store: Store =
  globalForMock.commerceCraftStore ??
  (globalForMock.commerceCraftStore = initialStore);

export const mockDb = {
  keys,
  store
};
