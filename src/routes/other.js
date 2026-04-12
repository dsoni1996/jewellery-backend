const express = require("express");
const { protect, authorise } = require("../middleware/auth");

/* ── Orders ── */
const orderRouter = express.Router();
const oc = require("../controllers/orderController");

orderRouter.post  ("/",                     protect, oc.createOrder);
orderRouter.get   ("/",                     protect, oc.getMyOrders);
orderRouter.get   ("/:orderNumber",         protect, oc.getOrder);
orderRouter.put   ("/:id/cancel",           protect, oc.cancelOrder);

/* Admin order routes */
orderRouter.get   ("/admin/all",            protect, authorise("admin"), oc.getAllOrders);
orderRouter.put   ("/admin/:id/status",     protect, authorise("admin"), oc.updateOrderStatus);

/* ── Cart ── */
const cartRouter = express.Router();
const cc = require("../controllers/cartController");

cartRouter.get    ("/",           protect, cc.getCart);
cartRouter.post   ("/add",        protect, cc.addToCart);
cartRouter.put    ("/:itemId",    protect, cc.updateItem);
cartRouter.delete ("/:itemId",    protect, cc.removeItem);
cartRouter.post   ("/coupon",     protect, cc.applyCoupon);
cartRouter.delete ("/coupon",     protect, cc.removeCoupon);
cartRouter.delete ("/",           protect, cc.clearCart);

/* ── Wishlist ── */
const wishlistRouter = express.Router();
const wc = require("../controllers/wishlistController");

wishlistRouter.get  ("/",           protect, wc.getWishlist);
wishlistRouter.post ("/:productId", protect, wc.toggleWishlist);

module.exports = { orderRouter, cartRouter, wishlistRouter };
