import type { Timestamp } from "firebase/firestore";

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  id: string | number;
  title: string;
  price: number;
  quantity: number;
  oldPrice?: number;
  image?: string;
  size?: string;
  color?: string;
};

export type OrderContact = {
  email?: string | null;
  phoneCountryCode?: string | null;
  phone?: string | null;
  alternativePhoneCountryCode?: string | null;
  alternativePhone?: string | null;
};

export type OrderDelivery = {
  fullName?: string | null;
  governorate?: string | null;
  address?: string | null;
};

export type Order = {
  id: string;
  userId: string;
  userEmail?: string | null;
  contact?: OrderContact;
  delivery?: OrderDelivery;
  discountCode?: string | null;
  paymentMethod?: "cash" | "online" | string;
  items: OrderItem[];
  subtotal: number;
  totalSavings?: number;
  status?: OrderStatus;
  createdAt?: Timestamp | { seconds?: number } | null;
};

/** Optional `users` collection written by the storefront on sign up. */
export type UserRecord = {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  phone?: string | null;
  photoURL?: string | null;
  createdAt?: Timestamp | { seconds?: number } | null;
  lastLoginAt?: Timestamp | { seconds?: number } | null;
  /** true when the row was reconstructed from the orders collection instead of a `users` document */
  derived?: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: { seconds?: number } | null;
};
