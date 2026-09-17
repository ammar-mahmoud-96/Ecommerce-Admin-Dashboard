import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "../lib/firebase";
import { toSeconds } from "../lib/format";
import type { Order, UserRecord } from "../types";

type UsersDocument = {
  uid?: string;
  email?: string | null;
  displayName?: string | null;
  name?: string | null;
  phone?: string | null;
  photoURL?: string | null;
  createdAt?: { seconds?: number } | null;
  lastLoginAt?: { seconds?: number } | null;
};

/**
 * The storefront only registers accounts in Firebase Auth, so a `users` collection may be
 * absent. Whatever exists there is merged with the customers reconstructed from `orders`.
 */
export function useCustomers(orders: Order[], ordersLoading: boolean) {
  const [userDocs, setUserDocs] = useState<Record<string, UsersDocument>>({});
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      collection(getFirebaseDb(), "users"),
      (snapshot) => {
        const next: Record<string, UsersDocument> = {};
        snapshot.docs.forEach((document) => {
          const data = document.data() as UsersDocument;
          next[data.uid || document.id] = data;
        });
        setUserDocs(next);
        setUsersLoading(false);
        setUsersError(null);
      },
      (error) => {
        setUserDocs({});
        setUsersLoading(false);
        setUsersError(error.message);
      },
    );
  }, []);

  const customers = useMemo<UserRecord[]>(() => {
    const byUid = new Map<string, UserRecord>();

    Object.entries(userDocs).forEach(([uid, data]) => {
      byUid.set(uid, {
        id: uid,
        uid,
        email: data.email ?? null,
        displayName: data.displayName ?? data.name ?? null,
        phone: data.phone ?? null,
        photoURL: data.photoURL ?? null,
        createdAt: data.createdAt ?? null,
        lastLoginAt: data.lastLoginAt ?? null,
        derived: false,
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
      });
    });

    orders.forEach((order) => {
      if (!order.userId) return;
      const existing = byUid.get(order.userId);
      const orderSeconds = toSeconds(order.createdAt as { seconds?: number });
      const record: UserRecord = existing ?? {
        id: order.userId,
        uid: order.userId,
        email: order.userEmail ?? order.contact?.email ?? null,
        displayName: order.delivery?.fullName ?? null,
        phone: order.contact?.phone ?? null,
        derived: true,
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };

      record.email =
        record.email ?? order.userEmail ?? order.contact?.email ?? null;
      record.displayName =
        record.displayName ?? order.delivery?.fullName ?? null;
      record.phone = record.phone ?? order.contact?.phone ?? null;
      record.orderCount += 1;
      record.totalSpent += order.subtotal ?? 0;
      if (orderSeconds > toSeconds(record.lastOrderAt))
        record.lastOrderAt = { seconds: orderSeconds };
      byUid.set(order.userId, record);
    });

    return [...byUid.values()].sort((first, second) => {
      const firstSeen =
        toSeconds(first.createdAt as { seconds?: number }) ||
        toSeconds(first.lastOrderAt);
      const secondSeen =
        toSeconds(second.createdAt as { seconds?: number }) ||
        toSeconds(second.lastOrderAt);
      return secondSeen - firstSeen;
    });
  }, [userDocs, orders]);

  return {
    customers,
    isLoading: usersLoading || ordersLoading,
    /** Set when the `users` collection is missing or unreadable; derived rows are still shown. */
    usersError,
    hasUsersCollection: Object.keys(userDocs).length > 0,
  };
}
