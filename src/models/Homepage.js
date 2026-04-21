const mongoose = require("mongoose");

/* ── Each section on the home page ── */
const SectionSchema = new mongoose.Schema({
  id:       { type: String, required: true },   // unique per section e.g. "hero", "trending-1"
  type:     {
    type: String,
    required: true,
    enum: [
      "hero_carousel",      // full-width hero slider
      "collection_grid",    // 3-panel collection mosaic
      "categories",         // horizontal category circles
      "trending",           // 3-column trending cards
      "new_arrivals",       // dark new arrivals strip
      "trust_world",        // trust features + editorial stories
      "product_row",        // horizontal product scroll (fetched by filter)
      "banner_single",      // single full-width promotional banner
      "banner_split",       // 2-col split banner
      "testimonials",       // customer reviews
      "newsletter",         // email signup strip
    ],
  },
  label:    { type: String, required: true },   // admin-facing name
  visible:  { type: Boolean, default: true },   // show/hide toggle
  order:    { type: Number,  required: true },  // display sequence (0-based)

  /* ── Section-specific settings ── */
  settings: {
    /* hero_carousel */
    slides: [{
      img:     String,
      eyebrow: String,
      title:   String,
      titleEm: String,  // italic highlighted word
      subtitle:String,
      ctaLabel:String,
      ctaHref: String,
    }],

    /* collection_grid */
    collections: [{
      img:   String,
      title: String,
      sub:   String,
      href:  String,
      span:  { type: String, enum: ["large","small"], default: "small" },
    }],

    /* categories */
    showViewAll: { type: Boolean, default: true },

    /* trending / new_arrivals / product_row */
    title:       String,   // section heading
    subtitle:    String,
    productFilter: {
      category:    String,
      purity:      String,
      isBestSeller:Boolean,
      isNewArrival:Boolean,
      isFeatured:  Boolean,
      isWedding:   Boolean,
      limit:       { type: Number, default: 6 },
    },

    /* banner_single */
    bannerImg:    String,
    bannerTitle:  String,
    bannerSub:    String,
    bannerCta:    String,
    bannerHref:   String,
    bannerDark:   { type: Boolean, default: true },

    /* banner_split */
    leftImg:      String,
    leftTitle:    String,
    leftHref:     String,
    rightImg:     String,
    rightTitle:   String,
    rightHref:    String,

    /* generic background colour override */
    bgColor:      { type: String, default: "" },
  },
}, { _id: false });

const HomePageSchema = new mongoose.Schema({
  name:     { type: String, default: "Main Home Page" },
  sections: [SectionSchema],
  updatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("HomePage", HomePageSchema);
