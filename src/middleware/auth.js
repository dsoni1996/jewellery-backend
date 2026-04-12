const jwt  = require("jsonwebtoken");
const User = require("../models/User");

/* ── Protect: verify JWT ── */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorised — please log in" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: "Account suspended" });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

/* ── Authorise: role-based ── */
exports.authorise = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not permitted to access this route`,
    });
  }
  next();
};

/* ── Optional auth (attach user if token present but don't block) ── */
exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch { /* ignore */ }
  }
  next();
};
