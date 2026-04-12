const { Cart, Coupon } = require("../models/Cart");
const Product = require("../models/Product");
const { AppError } = require("../middleware/error");

const populateCart = cart => cart.populate("items.product", "name thumbnail price sku inventory");

/* ──────────────────────────────────────────
   @route  GET /api/cart
   @access Private
────────────────────────────────────────── */
exports.getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });
  await populateCart(cart);
  res.json({ success: true, cart, totals: cart.getTotals() });
};

/* ──────────────────────────────────────────
   @route  POST /api/cart/add
   @body   { productId, qty, size, engraving }
   @access Private
────────────────────────────────────────── */
exports.addToCart = async (req, res) => {
  const { productId, qty = 1, size, engraving } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new AppError("Product not found", 404);
  if (!product.inventory.inStock) throw new AppError("Product out of stock", 400);

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

  const existing = cart.items.find(
    i => i.product.toString() === productId && i.size === size
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({ product: productId, qty, size, engraving, priceAtAdd: product.price.current });
  }

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, message: "Added to cart", cart, totals: cart.getTotals() });
};

/* ──────────────────────────────────────────
   @route  PUT /api/cart/:itemId
   @body   { qty }
   @access Private
────────────────────────────────────────── */
exports.updateItem = async (req, res) => {
  const { qty } = req.body;
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) throw new AppError("Cart not found", 404);

  const item = cart.items.id(req.params.itemId);
  if (!item) throw new AppError("Item not in cart", 404);

  if (qty <= 0) {
    cart.items.pull(req.params.itemId);
  } else {
    item.qty = qty;
  }

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, cart, totals: cart.getTotals() });
};

/* ──────────────────────────────────────────
   @route  DELETE /api/cart/:itemId
   @access Private
────────────────────────────────────────── */
exports.removeItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) throw new AppError("Cart not found", 404);
  cart.items.pull(req.params.itemId);
  await cart.save();
  await populateCart(cart);
  res.json({ success: true, cart, totals: cart.getTotals() });
};

/* ──────────────────────────────────────────
   @route  POST /api/cart/coupon
   @body   { code }
   @access Private
────────────────────────────────────────── */
exports.applyCoupon = async (req, res) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) throw new AppError("Invalid coupon code", 400);
  if (new Date() > coupon.validUntil) throw new AppError("Coupon expired", 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  const cart = await Cart.findOne({ user: req.user.id }).populate("items.product", "price");
  if (!cart) throw new AppError("Cart is empty", 400);

  const subtotal = cart.items.reduce((s, i) => s + (i.product.price.current * i.qty), 0);
  if (subtotal < coupon.minOrderValue) {
    throw new AppError(`Minimum order value ₹${coupon.minOrderValue} required`, 400);
  }

  let discount = coupon.discountType === "percent"
    ? (subtotal * coupon.discountValue) / 100
    : coupon.discountValue;

  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

  cart.couponCode     = coupon.code;
  cart.couponDiscount = Math.round(discount);
  await cart.save();

  res.json({ success: true, message: `Coupon applied! You save ₹${Math.round(discount)}`, discount: Math.round(discount) });
};

/* ──────────────────────────────────────────
   @route  DELETE /api/cart/coupon
   @access Private
────────────────────────────────────────── */
exports.removeCoupon = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) throw new AppError("Cart not found", 404);
  cart.couponCode = null;
  cart.couponDiscount = 0;
  await cart.save();
  res.json({ success: true, message: "Coupon removed" });
};

/* ──────────────────────────────────────────
   @route  DELETE /api/cart
   @desc   Clear entire cart
   @access Private
────────────────────────────────────────── */
exports.clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], couponCode: null, couponDiscount: 0 });
  res.json({ success: true, message: "Cart cleared" });
};
