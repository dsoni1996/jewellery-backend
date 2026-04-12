const mongoose = require("mongoose");

/* ─── CART ─────────────────────────────── */
const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  qty:     { type: Number, required: true, min: 1, default: 1 },
  size:    { type: Number, default: null },
  engraving: { type: String, default: null },
  priceAtAdd: { type: Number },               // snapshot price when added
}, { _id: true, timestamps: true });

const CartSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items:       [CartItemSchema],
  couponCode:  { type: String, default: null },
  couponDiscount: { type: Number, default: 0 },
}, { timestamps: true });

CartSchema.methods.getTotals = function () {
  const subtotal = this.items.reduce((s, i) => s + (i.priceAtAdd * i.qty), 0);
  const discount = this.couponDiscount || 0;
  const taxable  = subtotal - discount;
  const gst      = Math.round(taxable * 0.03);
  return { subtotal, discount, gst, total: taxable + gst, itemCount: this.items.length };
};

const Cart = mongoose.model("Cart", CartSchema);

/* ─── COUPON ────────────────────────────── */
const CouponSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true },
  description:    { type: String },
  discountType:   { type: String, enum: ["percent", "flat"], default: "percent" },
  discountValue:  { type: Number, required: true },   // % or ₹
  minOrderValue:  { type: Number, default: 0 },
  maxDiscount:    { type: Number, default: null },     // cap for % coupons
  usageLimit:     { type: Number, default: null },
  usedCount:      { type: Number, default: 0 },
  validFrom:      { type: Date, default: Date.now },
  validUntil:     { type: Date, required: true },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

const Coupon = mongoose.model("Coupon", CouponSchema);

module.exports = { Cart, Coupon };
