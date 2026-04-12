require("dotenv").config();
require("express-async-errors");

const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const morgan      = require("morgan");
const rateLimit   = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser  = require("cookie-parser");
const path          = require("path");

const connectDB    = require("./config/db");
const { errorHandler, notFound } = require("./middleware/error");

/* ── Route imports ── */
const authRoutes    = require("./routes/auth");
const productRoutes = require("./routes/products");
const { orderRouter, cartRouter, wishlistRouter } = require("./routes/other");
const adminRoutes   = require("./routes/admin");

/* ────────────────────────────────────────
   Bootstrap
─────────────────────────────────────── */
connectDB();

const app = express();

/* ── Security middleware ── */
app.use(helmet());
app.use(mongoSanitize());

/* ── CORS ── */
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ── Rate limiting ── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 200,
  message: { success: false, message: "Too many requests — please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hr
  max: 20,
  message: { success: false, message: "Too many auth attempts — please try again after 1 hour" },
});
app.use(limiter);

/* ── Body parsers ── */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

/* ── Logger ── */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* ── Static files ── */
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* ────────────────────────────────────────
   Routes
─────────────────────────────────────── */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MANAS Jewellery API is running 💎",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth",     authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders",   orderRouter);
app.use("/api/cart",     cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/admin",    adminRoutes);

/* ── 404 + Error handlers (must be last) ── */
app.use(notFound);
app.use(errorHandler);

/* ────────────────────────────────────────
   Start server
─────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n💎 MANAS API running on port ${PORT} [${process.env.NODE_ENV}]`);
  console.log(`   Health check → http://localhost:${PORT}/api/health\n`);
});

/* ── Graceful shutdown ── */
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Promise Rejection:", err.message);
  server.close(() => process.exit(1));
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down gracefully");
  server.close(() => process.exit(0));
});

module.exports = app;
