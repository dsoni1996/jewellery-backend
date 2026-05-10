const User      = require("../models/User");
const { AppError } = require("../middleware/error");

/* ── Helper: send token as cookie + JSON ── */
const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  const options = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id:        user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone,
        email:     user.email,
        role:      user.role,
        avatar:    user.avatar,
      },
    });
};

/* ──────────────────────────────────────────
   @route  POST /api/auth/register
   @desc   Register new user
   @access Public
────────────────────────────────────────── */
exports.register = async (req, res) => {
  const { firstName, lastName, phone, email, password, city } = req.body;

  const existing = await User.findOne({ phone });
  if (existing) throw new AppError("Phone number already registered", 409);

  const user = await User.create({ firstName, lastName, phone, email, password, city });

  // In production: send OTP here
  sendToken(user, 201, res);
};

/* ──────────────────────────────────────────
   @route  POST /api/auth/login
   @desc   Login — returns JWT
   @access Public
────────────────────────────────────────── */
exports.login = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone) throw new AppError("Phone number required", 400);

  const user = await User.findOne({ phone }).select("+password");
  if (!user) throw new AppError("Invalid credentials", 401);

  // If password-based login
  if (password) {
    const match = await user.matchPassword(password);
    if (!match) throw new AppError("Invalid credentials", 401);
  }

  user.otp = undefined;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, res);
};

/* ──────────────────────────────────────────
   @route  POST /api/auth/send-otp
   @desc   Send OTP to phone
   @access Public
────────────────────────────────────────── */
exports.sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new AppError("Phone required", 400);

  // 1. 6-digit OTP Generate karo
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min ki validity

  // 2. User me OTP save karo
  let user = await User.findOne({ phone });
  if (!user) {
    // ✅ FIX 1: Naya account banate time default details taaki DB error na de
    user = await User.create({ 
      phone: phone,
      firstName: "Manas",
      lastName: "Customer" 
    }); 
  }
  
  user.otp = { code: otp, expiresAt };
  await user.save({ validateBeforeSave: false });

  // 3. WHATSAPP SE BHEJO
  try {
    // WhatsApp web API ko number iss format me chahiye hota hai: 91XXXXXXXXXX@c.us
    const formattedNumber = phone.replace(/\D/g, ''); // Extra space/dash hatao
    const chatId = `91${formattedNumber}@c.us`; 
    
    // Message ka format
    const message = `💎 Welcome to *MANAS Jewellery*!\n\nYour secure login OTP is: *${otp}*\n\nThis is valid for 10 minutes. Please do not share it with anyone.`;

    // ✅ FIX 2: Global client use kiya hai circular dependency/undefined function error hatane ke liye
    await global.whatsappClient.sendMessage(chatId, message);

    console.log(`✅ WhatsApp OTP sent to ${phone}: ${otp}`);

    res.json({ success: true, message: "OTP sent to your WhatsApp!" });
  } catch (error) {
    console.error("WhatsApp Message Error:", error);
    throw new AppError("Failed to send WhatsApp message. Bot might not be ready.", 500);
  }
};

/* ──────────────────────────────────────────
   @route  POST /api/auth/verify-otp
   @desc   Verify OTP and login
   @access Public
────────────────────────────────────────── */
exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) throw new AppError("Phone and OTP required", 400);

  const user = await User.findOne({ phone });
  if (!user) throw new AppError("User not found", 404);

  if (!user.otp?.code || user.otp.code !== otp) {
    throw new AppError("Invalid OTP", 400);
  }
  if (new Date() > user.otp.expiresAt) {
    throw new AppError("OTP expired", 400);
  }

  user.otp = undefined;
  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, res);
};

/* ──────────────────────────────────────────
   @route  GET /api/auth/me
   @desc   Get current user profile
   @access Private
────────────────────────────────────────── */
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).populate("wishlist", "name thumbnail price slug");
  res.json({ success: true, user });
};

/* ──────────────────────────────────────────
   @route  PUT /api/auth/me
   @desc   Update profile
   @access Private
────────────────────────────────────────── */
exports.updateMe = async (req, res) => {
  const allowed = ["firstName", "lastName", "email"];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.json({ success: true, user });
};

/* ──────────────────────────────────────────
   @route  POST /api/auth/logout
   @desc   Clear token cookie
   @access Private
────────────────────────────────────────── */
exports.logout = (req, res) => {
  res.cookie("token", "", { expires: new Date(0), httpOnly: true });
  res.json({ success: true, message: "Logged out" });
};

/* ──────────────────────────────────────────
   @route  POST /api/auth/addresses
   @desc   Add a delivery address
   @access Private
────────────────────────────────────────── */
exports.addAddress = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (req.body.isDefault) {
    user.addresses.forEach(a => { a.isDefault = false; });
  }
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
};

/* ──────────────────────────────────────────
   @route  DELETE /api/auth/addresses/:id
   @desc   Remove an address
   @access Private
────────────────────────────────────────── */
exports.removeAddress = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
};