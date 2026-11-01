# ShopNova — Full-Stack E-Commerce Application

ShopNova is a full-stack e-commerce application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **MongoDB (Mongoose)**, **Razorpay integration**, and **Tailwind CSS v4**.

The project brings together a customer storefront, authentication, cart and checkout flows, order management, and an admin control center. It is documented as a portfolio and development project; the included demo OTP and test/mock payment configuration are not production-ready.

---

## 🚀 Features

### 🛒 Customer Storefront
- **Product Catalog & Search**: Real-time category filtering, price range filter, stock availability toggle, min-rating filter, debounced search, and sorting (Price Low→High, Price High→Low, Newest, Rating, Popularity, Discount).
- **Multi-Image Product Gallery**: Thumbnail-based image selector for products with multiple images, brand badges, and stock enforcement (Out of Stock banner when stock = 0).
- **Guest-to-User Cart Synchronization**: Seamless guest shopping using `localStorage` that automatically syncs and merges into the user's database cart upon login or registration.
- **Buy Now (Cart-Independent)**: Instant purchase without altering or clearing the customer's existing cart. The order is flagged `isBuyNow: true` and cart remains 100% intact.
- **Verified Purchaser Reviews**: Product review submission restricted strictly to authenticated users with a confirmed, paid/delivered order containing the item. Non-buyers receive: `"Only verified buyers can review this product."` (403 Forbidden).
- **4-Step Checkout Experience**: Delivery Address → Order Review → Payment Method → Confirmation. Includes saved address selection with Home/Work/Other badges and inline "Add New Address" form.
- **Razorpay & Payment Mode Flexibility**: Support for real Razorpay test payments or explicit `PAYMENT_MODE=mock` for standalone development testing.
- **Idempotent Payment Verification**: Server-side HMAC SHA256 signature verification preventing duplicate stock deduction or repeated order fulfillment on duplicate/retried requests.
- **Order History & Timeline Tracking**: Itemized order summary, payment status badge, visual fulfillment status timeline (Placed → Paid → Processing → Shipped → Delivered), cancellation display, and "Print / Save Invoice" button.
- **Profile & Address Management**: Edit name and phone, manage saved addresses (Add/Edit/Delete/Set Default) with Home/Work/Other label badges.

### 🔐 Authentication & OTP Verification
- **OTP-Based Registration Flow**: Register → Enter OTP → Account Activated → Session Established.
- **6-Digit OTP** with SHA-256 HMAC hashing and timing-safe comparison (`crypto.timingSafeEqual`).
- **OTP Expiry**: 10 minutes.
- **Rate Limiting**: Maximum 5 verification attempts per OTP. 60-second cooldown between resend requests.
- **Unverified Account Protection**: Login is blocked for unverified accounts with automatic redirect to the OTP verification screen.
- **Common Login Page**: One login page for both customers and admins. The database `role` field determines access level.

> ⚠️ **Demo OTP Mode**: For development and placement evaluation purposes, the OTP is hardcoded to **`123456`**. No SMTP/SMS integration is active. **This must be replaced with a real email/SMS OTP provider for production deployment.**

### 🛡️ Admin Management Control Center (`/admin`)
- **Real Database Aggregation Dashboard**: MongoDB `$group` and `$facet` aggregation pipelines calculating total revenue (from paid orders), confirmed order counts, customer totals, low stock counts, and revenue trends.
- **Product Management (CRUD)**: Create, edit, and soft-delete products. Server-side validation enforcing non-negative prices/stock and MRP ≥ Price.
- **Order Fulfillment Control**: State machine validating order status transitions (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED / CANCELLED). Disallows invalid state reversals.
- **Dedicated Inventory Experience (`/admin/inventory`)**: Real-time stock monitor, low-stock alerts (≤ 5 units), out-of-stock indicators, and inline atomic stock updating.
- **User Directory & Role Toggle**: View customer accounts and delegate Administrator access.
- **Server-Side Admin RBAC**: Every `/api/admin/*` endpoint and `/admin` page enforces JWT authentication combined with database user lookup (`user.role === 'admin'`). Normal users cannot see or access the Admin Panel link.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) & React 19 |
| **Language** | TypeScript & Node.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (HTTP-only cookies) + Bcryptjs password hashing + SHA-256 HMAC OTP |
| **Payment** | Razorpay Node.js SDK & HMAC SHA256 Signature Verification |
| **Styling** | Tailwind CSS v4, Lucide Icons |

---

## 📁 Folder Structure

```
shopnova/
├── scripts/
│   └── seed.js                    # Database seeding script
├── src/
│   ├── app/
│   │   ├── (auth)/                # Auth pages (login, register, verify-otp)
│   │   ├── admin/                 # Admin dashboard, products, orders, users, inventory
│   │   ├── api/
│   │   │   ├── admin/             # Admin API routes (RBAC protected)
│   │   │   ├── auth/              # Register, login, verify-otp, resend-otp, me
│   │   │   ├── addresses/         # Address CRUD API
│   │   │   ├── cart/              # Cart API
│   │   │   ├── categories/        # Categories API
│   │   │   ├── orders/            # Customer order API
│   │   │   ├── payment/           # Payment creation & verification
│   │   │   └── products/          # Product listing & reviews API
│   │   ├── cart/                  # Cart page
│   │   ├── checkout/              # 4-step checkout page
│   │   ├── orders/                # Customer order history & detail
│   │   ├── order-success/         # Post-payment confirmation
│   │   ├── products/              # Catalog listing & product detail
│   │   ├── profile/               # Profile & address management
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Homepage
│   ├── components/                # Shared components (Navbar, ProductCard, Footer)
│   ├── context/                   # AuthContext, CartContext
│   ├── lib/                       # Database, auth helpers, OTP utilities
│   └── models/                    # Mongoose schemas (User, Product, Order, Cart, Address, Category, Payment)
├── .env.local                     # Environment configuration
├── package.json
└── tsconfig.json
```

---

## 📊 Database Models

| Model | Key Fields |
|---|---|
| **User** | `name`, `email` (unique), `password` (hashed, select: false), `role` ('user' \| 'admin'), `phone`, `isVerified`, `otpHash` (select: false), `otpExpiresAt`, `otpAttempts`, `otpLastSentAt`, `avatar` |
| **Product** | `name`, `slug`, `description`, `brand`, `category`, `tags`, `price`, `originalPrice` (MRP), `discount`, `stock`, `image`, `images[]`, `rating`, `numReviews`, `reviews[]`, `featured`, `isBestSeller`, `isDeleted` |
| **Order** | `orderNumber`, `user`, `items[]`, `shippingAddress` (snapshot), `itemsPrice`, `taxPrice`, `shippingPrice`, `totalPrice`, `paymentStatus`, `orderStatus`, `paymentResult`, `isBuyNow` |
| **Cart** | `user` (ref), `items[]` (`product` ref, `quantity`) |
| **Address** | `user` (ref), `fullName`, `phone`, `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`, `isDefault`, `label` ('Home' \| 'Work' \| 'Other') |
| **Category** | `name`, `slug`, `description`, `image` |
| **Payment** | `order` (ref), `user` (ref), `razorpayOrderId`, `amount`, `currency`, `status` |

---

## 🔗 API Routes

### Authentication
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new account (sets `isVerified: false`, generates OTP hash) |
| POST | `/api/auth/verify-otp` | Verify OTP, activate account, issue JWT session |
| POST | `/api/auth/resend-otp` | Resend OTP with 60s cooldown |
| POST | `/api/auth/login` | Login (blocks unverified accounts) |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile (name, phone) |

### Customer
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/cart` | Get or update cart |
| GET/POST | `/api/addresses` | List or create addresses |
| PATCH/DELETE | `/api/addresses/[id]` | Update or delete address |
| POST | `/api/orders` | Create order (supports cart and Buy Now) |
| GET | `/api/orders` | List user's orders |
| GET | `/api/orders/[id]` | Get order details |
| POST | `/api/payment/create` | Create Razorpay/mock payment |
| POST | `/api/payment/verify` | Verify payment & deduct stock (idempotent) |
| GET | `/api/products` | List products with filters |
| GET | `/api/products/[id]` | Get product detail |
| POST | `/api/products/[id]/reviews` | Submit review (verified buyers only) |
| GET | `/api/categories` | List categories |

### Admin (RBAC Protected)
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard aggregation metrics |
| GET/POST | `/api/admin/products` | List or create products |
| PATCH/DELETE | `/api/admin/products/[id]` | Update or soft-delete products |
| GET | `/api/admin/orders` | List all orders |
| PATCH | `/api/admin/orders/[id]/status` | Update order status (state machine) |
| GET | `/api/admin/inventory` | Inventory summary & stock levels |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/[id]` | Toggle user role |

---

## 🔐 Authentication Architecture

1. **Registration**: User submits name/email/password → Account created with `isVerified: false` → OTP hash stored in DB → Redirect to `/verify-otp`.
2. **OTP Verification**: User enters 6-digit OTP → Server compares using timing-safe HMAC → On success: `isVerified: true`, JWT cookie issued, session established.
3. **Login**: Password validated → `isVerified` checked → If unverified, 403 with redirect to OTP screen → If verified, JWT cookie issued.
4. **Admin RBAC**: JWT decoded → User fetched from DB → `role === 'admin'` checked → Access granted or 403.

---

## 💳 Payment Architecture

### Payment Modes

Set via `PAYMENT_MODE` environment variable:

- **`razorpay`** (default): Real Razorpay test mode integration. Requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- **`mock`**: Instant payment simulation for development. Must be **explicitly configured** — never silently activated.

### Payment Flow
1. Customer completes checkout → POST `/api/payment/create` → Razorpay order created (or mock order).
2. Client-side Razorpay modal opens → Customer completes payment.
3. POST `/api/payment/verify` → HMAC SHA256 signature verification → Stock deduction (atomic `$inc` with `$gte` guard) → Order marked `PAID`.
4. **Idempotency**: If `order.paymentStatus === 'PAID'`, returns success immediately without re-running stock deduction.
5. **Buy Now Independence**: If `order.isBuyNow === true`, the customer's database cart is never touched.

---

## 🔐 Environment Variables (`.env.local`)

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/shopnova

# JWT Authentication
JWT_SECRET=replace_with_a_long_random_secret

# Payment Mode Configuration ('razorpay' | 'mock')
PAYMENT_MODE=razorpay

# Razorpay Test Credentials (Required when PAYMENT_MODE=razorpay)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YourKeyId
RAZORPAY_KEY_ID=rzp_test_YourKeyId
RAZORPAY_KEY_SECRET=YourRazorpaySecretKey
```

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local` in the repository root and add the variables above. Keep this file local; it is ignored by Git.

### 3. Seed Database
Populate MongoDB with default accounts, product catalog across 5 categories, sample reviews, addresses, and historical orders:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@shopnova.com` | `Admin@123` |
| **Customer** | `user@shopnova.com` | `User@123` |
| **Demo** | `demo@shopnova.com` | `Demo@123` |

### Demo OTP

> **`123456`** — This is the hardcoded demo OTP for development and placement evaluation **only**. It must be replaced with a real email/SMS OTP provider (e.g., Twilio, SendGrid, AWS SES) before any production deployment.

---

## 🧪 Quality Control

```bash
# ESLint (Target: 0 errors, 0 warnings)
npm run lint

# Production Build Verification
npm run build

# Database Seeding
npm run seed
```

---

## 🔒 Security Notes

- Passwords are hashed with **bcryptjs** (12 salt rounds) and never stored in plaintext.
- OTPs are hashed with **HMAC SHA-256** and verified using **timing-safe comparison** to prevent timing attacks.
- JWT tokens are stored in **HTTP-only, secure cookies** — inaccessible to client-side JavaScript.
- All admin API routes enforce **server-side RBAC** — role verification happens at the database level, not just the frontend.
- Payment verification uses **Razorpay HMAC SHA256 signature verification** to prevent payment tampering.
- Stock deduction uses **atomic MongoDB operations** (`$inc` with `$gte` guard) with full rollback on partial failures.
- The `password` and `otpHash` fields are excluded from all queries by default (`select: false`).
