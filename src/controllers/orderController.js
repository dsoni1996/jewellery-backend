const Order    = require("../models/Order");
const { Cart }  = require("../models/Cart");
const { AppError } = require("../middleware/error");

/* ──────────────────────────────────────────
   @route  POST /api/orders
   @desc   Create order from cart
   @access Private
────────────────────────────────────────── */
exports.createOrder = async (req, res) => {
  const { shippingAddress, payment, isGift, giftMessage, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user.id }).populate("items.product", "name thumbnail sku price inventory");
  if (!cart || cart.items.length === 0) throw new AppError("Cart is empty", 400);

  /* Check stock */
  for (const item of cart.items) {
    if (!item.product.inventory.inStock || item.product.inventory.quantity < item.qty) {
      throw new AppError(`"${item.product.name}" is out of stock`, 400);
    }
  }

  const totals = cart.getTotals();

  const order = await Order.create({
    user: req.user.id,
    items: cart.items.map(i => ({
      product: i.product._id,
      name:    i.product.name,
      image:   i.product.thumbnail,
      sku:     i.product.sku,
      price:   i.product.price.current,
      qty:     i.qty,
      size:    i.size,
      engraving: i.engraving,
    })),
    shippingAddress,
    pricing: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      gst:      totals.gst,
      total:    totals.total,
      couponCode:     cart.couponCode,
      couponDiscount: cart.couponDiscount,
    },
    payment: { method: payment.method },
    isGift, giftMessage, notes,
  });

  /* Clear cart */
  cart.items = [];
  cart.couponCode = null;
  cart.couponDiscount = 0;
  await cart.save();

  /* Reduce inventory */
  for (const item of order.items) {
    await require("../models/Product").findByIdAndUpdate(item.product, {
      $inc: { "inventory.quantity": -item.qty },
    });
  }

  res.status(201).json({ success: true, order });
};

/* ──────────────────────────────────────────
   @route  GET /api/orders
   @desc   My orders (paginated)
   @access Private
────────────────────────────────────────── */
exports.getMyOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments({ user: req.user.id });

  const orders = await Order.find({ user: req.user.id })
    .select("-items.engraving")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, total, page: Number(page), orders });
};

/* ──────────────────────────────────────────
   @route  GET /api/orders/:orderNumber
   @desc   Single order by order number
   @access Private
────────────────────────────────────────── */
exports.getOrder = async (req, res) => {
  const order = await Order.findOne({
    orderNumber: req.params.orderNumber,
    user: req.user.id,
  }).populate("items.product", "slug images");

  if (!order) throw new AppError("Order not found", 404);
  res.json({ success: true, order });
};

/* ──────────────────────────────────────────
   @route  PUT /api/orders/:id/cancel
   @desc   Cancel order
   @access Private
────────────────────────────────────────── */
exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) throw new AppError("Order not found", 404);

  const cancellable = ["confirmed", "processing"];
  if (!cancellable.includes(order.status)) {
    throw new AppError(`Order cannot be cancelled — it is already ${order.status}`, 400);
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancellationReason = req.body.reason || "Requested by customer";
  order.tracking.push({ status: "cancelled", message: order.cancellationReason });
  await order.save();

  res.json({ success: true, message: "Order cancelled", order });
};

/* ──────────────────────────────────────────
   @route  GET /api/orders/admin/all    (admin)
   @desc   All orders with filters
   @access Private/Admin
────────────────────────────────────────── */
exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate("user", "firstName lastName phone email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), orders });
};

/* ──────────────────────────────────────────
   @route  PUT /api/orders/admin/:id/status (admin)
   @desc   Update order status
   @access Private/Admin
────────────────────────────────────────── */
exports.updateOrderStatus = async (req, res) => {
  const { status, message, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);

  order.status = status;
  order.tracking.push({ status, message: message || `Status updated to ${status}` });
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === "delivered") order.deliveredAt = new Date();
  await order.save();

  res.json({ success: true, order });
};
