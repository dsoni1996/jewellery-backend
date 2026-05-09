const mongoose = require("mongoose");

/* ── Hero slide ── */
const HeroSlideSchema = new mongoose.Schema({
  img:      { type: String, required: true },
  eyebrow:  { type: String, default: "" },
  title:    { type: String, default: "" },
  em:       { type: String, default: "" },  // italic highlight word
  subtitle: { type: String, default: "" },
  ctaLabel: { type: String, default: "Explore Collections" },
  ctaHref:  { type: String, default: "/listing?isWedding=true" },
  order:    { type: Number, default: 0 },
  visible:  { type: Boolean, default: true },
}, { _id: true });

/* ── Journey step ── */
const JourneyStepSchema = new mongoose.Schema({
  num:   { type: String, required: true },  // "01", "02" etc.
  title: { type: String, required: true },
  desc:  { type: String, default: "" },
  order: { type: Number, default: 0 },
}, { _id: true });

/* ── Testimonial ── */
const TestimonialSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  city:   { type: String, default: "" },
  text:   { type: String, required: true },
  set:    { type: String, default: "" },   // which product they bought
  img:    { type: String, default: "" },   // avatar image URL
  rating: { type: Number, default: 5, min: 1, max: 5 },
  order:  { type: Number, default: 0 },
  visible:{ type: Boolean, default: true },
}, { _id: true });

const WeddingConfigSchema = new mongoose.Schema({
  heroSlides:    [HeroSlideSchema],
  journeySteps:  [JourneyStepSchema],
  testimonials:  [TestimonialSchema],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("WeddingConfig", WeddingConfigSchema);
