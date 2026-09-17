# SHOP.CO Admin Dashboard

A React + Vite + TypeScript admin dashboard for the
[Shop.co storefront](https://github.com/ammar-mahmoud-96/Ecommerce). It reads the same Firebase
project as the storefront and renders orders, customers and product sales from Cloud Firestore.

## 📸 Screenshots
<img  src="https://github.com/ammar-mahmoud-96/Ecommerce-Admin-Dashboard/blob/main/src/assets/homePage.png?raw=true"/>

## Features

- Admin-only sign in (Firebase email/password + `admins/{uid}` allowlist enforced by Firestore rules).
- **Overview** — revenue, order count, customer count, average order value, and a 14-day revenue chart.
- **Orders** — live table of the `orders` collection with search, status/payment filters, sortable
  columns, pagination, a detail drawer (contact, delivery, line items, payment), status updates, and CSV export.
- **Customers** — every signed-in shopper with order count, lifetime spend and last order date, plus CSV export.
- **Products** — units sold and revenue per product, aggregated from order line items.

All tables use `onSnapshot`, so they update in real time as orders arrive.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file and paste the **same** Firebase web config the storefront uses
   (Firebase Console → Project settings → Your apps):

   ```bash
   cp .env.example .env.local
   ```

3. Create an admin account:
   - Firebase Console → **Authentication** → add a user (or reuse your own account).
   - Firestore → create collection `admins` → add a document whose **document ID is that user's UID**.
     Any fields you like, e.g. `{ email: "you@example.com", role: "owner" }`.

4. Publish the security rules in [firestore.rules](firestore.rules) (Firestore → Rules). They extend the
   storefront rules so that admins can read every order and customers keep reading only their own.

5. Run it:

   ```bash
   npm run dev
   ```

   Then open http://localhost:5173.

## Data model

Orders are read exactly as the storefront checkout writes them:

```
orders/{orderId}
  userId, userEmail
  contact { email, phoneCountryCode, phone, alternativePhoneCountryCode, alternativePhone }
  delivery { fullName, governorate, address }
  items [ { id, title, price, quantity, oldPrice?, image?, size?, color? } ]
  discountCode, paymentMethod, subtotal, totalSavings, createdAt
  status        // added by this dashboard; treated as "pending" when absent
```

### Listing customers

The storefront registers shoppers in **Firebase Authentication only** — there is no `users`
collection — and the Auth user list can only be enumerated with the Admin SDK from a trusted server,
which a browser dashboard cannot do safely.

This dashboard therefore reads an optional `users` collection and merges it with the customers it can
reconstruct from `orders`. To get the complete list (including shoppers who never checked out), add a
profile write to the storefront's `src/pages/sign-in.tsx`:

```ts
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "../lib/firebase";

async function saveUserProfile(user: User, fallbackName?: string) {
  await setDoc(
    doc(getFirebaseDb(), "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || fallbackName || null,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  );
}
```

Call it after `createUserWithEmailAndPassword` (and after `signInWithEmailAndPassword`, where only
`lastLoginAt` changes thanks to `{ merge: true }`). The Customers table flags each row with its source
(`users` vs `orders`) so you can see the coverage.

## Scripts

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Dev server on port 5173         |
| `npm run build`   | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build      |
| `npm run lint`    | Type-check only                 |

## Security notes

- The Firebase web config is public by design; access is controlled by the Firestore rules, not by
  hiding keys. The client-side admin check is a UX convenience — `firestore.rules` is the real boundary.
- Admin documents are not writable by any client. Add admins from the Firebase Console.
- Orders can only have their `status` changed; nothing else can be edited or deleted from the dashboard.
- Deploy this app behind authentication only; `index.html` sets `noindex, nofollow`.
