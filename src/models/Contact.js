const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    subject: {
      type: String,
      enum: ["General Enquiry", "Product Query", "Order Issue", "Return / Exchange", "Customisation", "Store Visit", "Other"],
      default: "General Enquiry",
    },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);