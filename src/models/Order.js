const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:     { type: String, required: true },
  image:    { type: String, required: true },
  sku:      { type: String },
  price:    { type: Number, required: true },
  qty:      { type: Number, required: true, min: 1, default: 1 },
  size:     { type: Number, default: null },
  engraving:{ type: String, default: null },
}, { _id: true });

const TrackingSchema = new mongoose.Schema({
  status:    { type: String },
  message:   { type: String },
  timestamp: { type: Date, default: Date.now },
  location:  { type: String, default: null },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },          // MANAS-2025-00001
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  items:       [OrderItemSchema],

  shippingAddress: {
    fullName: { type: String, required: true },
    phone:    { type: String, required: true },
    line1:    { type: String, required: true },
    line2:    { type: String, default: "" },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true },
  },

  /* ── Pricing breakdown ── */
  pricing: {
    subtotal:      { type: Number, required: true },
    discount:      { type: Number, default: 0 },
    gst:           { type: Number, default: 0 },     // 3%
    shippingCharge:{ type: Number, default: 0 },
    total:         { type: Number, required: true },
    couponCode:    { type: String, default: null },
    couponDiscount:{ type: Number, default: 0 },
  },

  /* ── Payment ── */
  payment: {
    method:    { type: String, enum: ["card", "upi", "netbanking", "emi", "cod"], required: true },
    status:    { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    transactionId: { type: String, default: null },
    paidAt:    { type: Date, default: null },
  },

  /* ── Status ── */
  status: {
    type: String,
    enum: ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"],
    default: "confirmed",
  },

  tracking: [TrackingSchema],
  trackingNumber: { type: String, default: null },
  estimatedDelivery: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  cancellationReason: { type: String, default: null },

  isGift:       { type: Boolean, default: false },
  giftMessage:  { type: String, default: null },
  notes:        { type: String, default: null },

}, { timestamps: true });

/* ── Auto-generate order number ── */
OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `MANAS-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

/* ── Add first tracking entry on creation ── */
OrderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.tracking.push({ status: "confirmed", message: "Order placed successfully" });
    const d = new Date();
    d.setDate(d.getDate() + 7);
    this.estimatedDelivery = d;
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
