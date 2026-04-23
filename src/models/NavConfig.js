const mongoose = require("mongoose");

/* ── Each nav item ── */
const NavItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  href:        { type: String, default: "/" },
  visible:     { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
  hasMegaMenu: { type: Boolean, default: false },
}, { _id: true });

/* ── Each mega-menu column ── */
const MegaColSchema = new mongoose.Schema({
  title:         { type: String, default: "" },
  order:         { type: Number, default: 0 },
  highlightLast: { type: Boolean, default: false },
  items: [{
    label:   { type: String, required: true },
    href:    { type: String, required: true },
    visible: { type: Boolean, default: true },
  }],
}, { _id: true });

/* ── Featured image in mega menu ── */
const MegaImgSchema = new mongoose.Schema({
  src:     { type: String, required: true },
  alt:     { type: String, default: ""    },
  href:    { type: String, default: "/"   },
  visible: { type: Boolean, default: true },
  order:   { type: Number, default: 0     },
}, { _id: true });

const NavConfigSchema = new mongoose.Schema({
  /* Top announcement bar */
  topbar: {
    visible: { type: Boolean, default: true },
    text:    { type: String, default: "FREE SHIPPING ON ORDERS ABOVE ₹50,000 · BIS HALLMARKED JEWELLERY · VISIT OUR STORES" },
  },

  /* Nav items */
  navItems:  [NavItemSchema],

  /* Mega menu columns (for the "Jewellery" item) */
  megaCols:  [MegaColSchema],

  /* Featured images in mega menu */
  megaImgs:  [MegaImgSchema],

  /* Search hint chips */
  searchHints: [{ type: String }],

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("NavConfig", NavConfigSchema);
