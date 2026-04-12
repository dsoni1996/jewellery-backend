# MANAS Jewellery — Backend API

Node.js + Express + MongoDB REST API for the MANAS Jewellery Next.js app.

---

## 📁 Folder Structure

```
manas-backend/
├── src/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── models/
│   │   ├── User.js             # User + Address schema
│   │   ├── Product.js          # Product + Review schema
│   │   ├── Order.js            # Order + Tracking schema
│   │   └── Cart.js             # Cart + Coupon schema
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, OTP, Profile
│   │   ├── productController.js# CRUD, Search, Reviews, Home sections
│   │   ├── orderController.js  # Create, List, Cancel, Admin status
│   │   ├── cartController.js   # Add, Remove, Update, Coupon
│   │   └── wishlistController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── other.js            # Orders, Cart, Wishlist
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + role authorise
│   │   └── error.js            # Central error handler + AppError
│   ├── utils/
│   │   └── api-frontend.js     # Copy to frontend/lib/api.js
│   ├── seed/
│   │   └── seed.js             # Seed DB with sample data
│   └── server.js               # Entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
cd manas-backend
npm install
```

### 2. Create .env file
```bash
cp .env.example .env
```
Edit `.env` and fill in your values — especially `MONGO_URI` and `JWT_SECRET`.

### 3. Start MongoDB
```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas — paste your connection string in MONGO_URI
```

### 4. Seed the database
```bash
npm run seed
```
This creates:
- **8 sample products** (rings, necklaces, bangles, mangalsutra)
- **3 coupons**: `MANAS5`, `BRIDAL10`, `FLAT2000`
- **Admin user**: phone `9000000000` · password `Admin@123`

### 5. Start the server
```bash
npm run dev        # development (nodemon)
npm start          # production
```

Server runs on **http://localhost:5000**

---

## 🔗 API Endpoints

### Health
```
GET  /api/health
```

### Auth
```
POST /api/auth/register          # { firstName, lastName, phone, password }
POST /api/auth/login             # { phone, password }
POST /api/auth/send-otp          # { phone }
POST /api/auth/verify-otp        # { phone, otp }
POST /api/auth/logout            # 🔒
GET  /api/auth/me                # 🔒
PUT  /api/auth/me                # 🔒 { firstName, lastName, email }
POST /api/auth/addresses         # 🔒 add delivery address
DEL  /api/auth/addresses/:id     # 🔒
```

### Products
```
GET  /api/products               # filter: category, purity, minPrice, maxPrice,
                                 #         inStock, isBestSeller, isNewArrival,
                                 #         sort, search, page, limit
GET  /api/products/home-sections # bestSellers, newArrivals, trending, wedding
GET  /api/products/search/suggestions?q=ring
GET  /api/products/:slug         # single product
POST /api/products/:id/reviews   # 🔒 { rating, title, comment }

# Admin only 👑
POST /api/products               # create
PUT  /api/products/:id           # update
DEL  /api/products/:id           # soft delete
```

### Cart
```
GET  /api/cart                   # 🔒
POST /api/cart/add               # 🔒 { productId, qty, size }
PUT  /api/cart/:itemId           # 🔒 { qty }
DEL  /api/cart/:itemId           # 🔒
DEL  /api/cart                   # 🔒 clear cart
POST /api/cart/coupon            # 🔒 { code }
DEL  /api/cart/coupon            # 🔒
```

### Wishlist
```
GET  /api/wishlist               # 🔒
POST /api/wishlist/:productId    # 🔒 toggle (add/remove)
```

### Orders
```
POST /api/orders                 # 🔒 create from cart
GET  /api/orders                 # 🔒 my orders
GET  /api/orders/:orderNumber    # 🔒
PUT  /api/orders/:id/cancel      # 🔒 { reason }

# Admin only 👑
GET  /api/orders/admin/all       # all orders + filter by status
PUT  /api/orders/admin/:id/status # { status, message, trackingNumber }
```

---

## 🔌 Connect to Next.js Frontend

### 1. Add env variable
In your Next.js app, add to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Copy the API helper
Copy `src/utils/api-frontend.js` to your Next.js project at `lib/api.js`

### 3. Use in components
```js
// Get products
import api from "@/lib/api";

const { products } = await api.products.getAll({ category: "Ring", limit: 8 });

// Login
const { token, user } = await api.auth.login({ phone: "9876543210", password: "pass" });

// Add to cart (with token from localStorage/context)
await api.cart.add({ productId: "...", qty: 1, size: 14 }, token);

// Toggle wishlist
await api.wishlist.toggle(productId, token);

// Place order
const { order } = await api.orders.create({
  shippingAddress: { fullName: "...", phone: "...", ... },
  payment: { method: "upi" }
}, token);
```

---

## 🛡️ Security Features
- **Helmet** — HTTP security headers
- **Rate limiting** — 200 req/15min global, 20 req/hr on auth routes
- **MongoDB sanitize** — prevent NoSQL injection
- **JWT** — httpOnly cookie + Authorization header
- **bcrypt** — password hashing (salt rounds: 10)
- **express-async-errors** — no try/catch needed in controllers

---

## 📊 Order Status Flow
```
confirmed → processing → packed → shipped → out_for_delivery → delivered
                                                    ↓
                                               cancelled / returned
```
Each status change is recorded in the `tracking` array with timestamp.

---

## 🔧 Environment Variables
| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | development / production |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | Token expiry (e.g. `7d`) |
| `JWT_COOKIE_EXPIRE` | Cookie expiry in days |
| `CLIENT_URL` | Frontend URL for CORS |
| `SMTP_*` | Email settings for Nodemailer |
