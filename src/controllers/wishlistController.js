const User    = require("../models/User");
const Product = require("../models/Product");
const { AppError } = require("../middleware/error");

/* ──────────────────────────────────────────
   @route  GET /api/wishlist
   @access Private
────────────────────────────────────────── */
exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate("wishlist", "name slug thumbnail price rating reviewCount isBestSeller metal");
  res.json({ success: true, wishlist: user.wishlist });
};

/* ──────────────────────────────────────────
   @route  POST /api/wishlist/:productId
   @desc   Toggle wishlist (add if not present, remove if present)
   @access Private
────────────────────────────────────────── */
exports.toggleWishlist = async (req, res) => {
  const user = await User.findById(req.user.id);
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);

  const idx = user.wishlist.indexOf(productId);
  let action;

  if (idx === -1) {
    user.wishlist.push(productId);
    action = "added";
  } else {
    user.wishlist.splice(idx, 1);
    action = "removed";
  }

  await user.save({ validateBeforeSave: false });
  res.json({ success: true, action, message: `${action === "added" ? "Added to" : "Removed from"} wishlist` });
};
