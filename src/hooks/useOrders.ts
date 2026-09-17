import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFirebaseDb } from "../lib/firebase";
import type { Order } from "../types";

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
};

/** Live subscription to the storefront `orders` collection, newest first. */
export function useOrders(): OrdersState {
  const [state, setState] = useState<OrdersState>({
    orders: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const ordersQuery = query(
      collection(getFirebaseDb(), "orders"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      ordersQuery,
      (snapshot) => {
        const orders = snapshot.docs.map(
          (document) => ({ id: document.id, ...document.data() }) as Order,
        );
        setState({ orders, isLoading: false, error: null });
      },
      (error) =>
        setState({ orders: [], isLoading: false, error: error.message }),
    );
  }, []);

  return state;
}
