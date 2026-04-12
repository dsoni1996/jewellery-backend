const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

const AddressSchema = new mongoose.Schema({
  label:     { type: String, default: "Home" },          // Home | Work | Other
  fullName:  { type: String, required: true },
  phone:     { type: String, required: true },
  line1:     { type: String, required: true },
  line2:     { type: String, default: "" },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const UserSchema = new mongoose.Schema({
  firstName:  { type: String, required: [true, "First name required"], trim: true },
  lastName:   { type: String, required: [true, "Last name required"],  trim: true },
  email:      { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone:      { type: String, required: [true, "Phone required"], unique: true, trim: true },
  password:   { type: String, minlength: 6, select: false },
  avatar:     { type: String, default: null },

  role:       { type: String, enum: ["user", "admin"], default: "user" },
  isActive:   { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  addresses:  [AddressSchema],
  wishlist:   [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

  otp: {
    code:      String,
    expiresAt: Date,
  },

  resetPasswordToken:   String,
  resetPasswordExpire:  Date,
}, { timestamps: true });

/* ── Hash password before save ── */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ── Compare password ── */
UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

/* ── Sign JWT ── */
UserSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/* ── Virtual: full name ── */
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", UserSchema);
