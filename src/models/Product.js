const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  title:   { type: String },
  comment: { type: String, required: true },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  sku:         { type: String, required: true, unique: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: "" },

  category:    {
    type: String,
    required: true,
    enum: ["Ring", "Necklace", "Earring", "Bangle", "Bracelet",
           "Mangalsutra", "Pendant", "Chain", "Haath Phool", "Other"],
  },
  subCategory: { type: String, default: "" },
  occasion:    [{ type: String }],              // ["Wedding", "Daily", "Festive"]
  isWedding:   { type: Boolean, default: false },

  /* ── Pricing ── */
  price: {
    current:         { type: Number, required: true, min: 0 },
    original:        { type: Number, default: null },
    currency:        { type: String, default: "INR" },
    discountPercent: { type: Number, default: 0 },
  },

  /* ── Images ── */
  images:    [{ type: String }],
  thumbnail: { type: String, required: true },

  /* ── Metal ── */
  metal: {
    type:   { type: String },                  // Yellow Gold | White Gold | Rose Gold
    purity: { type: String },                  // 22KT | 18KT | 14KT
    weight: { type: Number },                  // grams
    colour: { type: String },
  },

  /* ── Stones ── */
  stones: {
    type:   { type: String, default: null },   // Diamond | Emerald | Ruby ...
    weight: { type: Number, default: null },   // ct
    shape:  { type: String, default: null },
    clarity:{ type: String, default: null },
    certification: { type: String, default: null },
  },

  /* ── Variants ── */
  variants: {
    sizes:  [{ type: Number }],
    colors: [{ type: String }],
  },

  /* ── Inventory ── */
  inventory: {
    inStock:  { type: Boolean, default: true },
    quantity: { type: Number, default: 0, min: 0 },
  },

  /* ── Flags ── */
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isFeatured:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },

  /* ── Features ── */
  features: {
    tryAtHome:        { type: Boolean, default: false },
    similarAvailable: { type: Boolean, default: true },
    engravingAvailable: { type: Boolean, default: false },
  },

  makingCharges:   { type: Number, default: 0 },
  offerText:       { type: String, default: null },
  certification:   { type: String, default: "BIS Hallmarked" },

  /* ── Reviews ── */
  reviews:     [ReviewSchema],
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },

}, { timestamps: true });

/* ── Indexes for fast querying ── */
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ "price.current": 1 });
ProductSchema.index({ isBestSeller: 1, isFeatured: 1 });
ProductSchema.index({ name: "text", description: "text" }); // full-text search

/* ── Auto-update rating after review changes ── */
ProductSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.reviewCount = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.rating = Math.round((total / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
};

module.exports = mongoose.model("Product", ProductSchema);
