const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    hours: { type: String, required: true, trim: true },
    mapEmbedUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    email: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);

storeSchema.index({ order: 1 });

module.exports = mongoose.model("Store", storeSchema);