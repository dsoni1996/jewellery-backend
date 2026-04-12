const Order   = require("../models/Order");
const Product = require("../models/Product");
const User    = require("../models/User");

/* ──────────────────────────────────────────
   @route  GET /api/admin/stats
   @desc   Dashboard summary stats
   @access Private/Admin
────────────────────────────────────────── */
exports.getSummaryStats = async (req, res) => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);      // this month start
  const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);  // last month start

  const [
    totalRevenue, thisMonthRevenue, lastMonthRevenue,
    totalOrders,  thisMonthOrders,  lastMonthOrders,
    totalCustomers, thisMonthCustomers,
    totalProducts, lowStockProducts,
    pendingOrders, recentOrders,
  ] = await Promise.all([
    /* Revenue */
    Order.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    Order.aggregate([
      { $match: { "payment.status": "paid", createdAt: { $gte: start } } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    Order.aggregate([
      { $match: { "payment.status": "paid", createdAt: { $gte: prev, $lt: start } } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),

    /* Orders */
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: start } }),
    Order.countDocuments({ createdAt: { $gte: prev, $lt: start } }),

    /* Customers */
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "user", createdAt: { $gte: start } }),

    /* Products */
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, "inventory.quantity": { $lte: 5 } }),

    /* Pending orders */
    Order.countDocuments({ status: { $in: ["confirmed", "processing", "packed"] } }),

    /* Recent 5 orders */
    Order.find()
      .populate("user", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber pricing.total status createdAt payment user items"),
  ]);

  const rev      = totalRevenue[0]?.total || 0;
  const revThis  = thisMonthRevenue[0]?.total || 0;
  const revPrev  = lastMonthRevenue[0]?.total || 1;
  const revTrend = parseFloat((((revThis - revPrev) / revPrev) * 100).toFixed(1));

  const ordTrend = lastMonthOrders
    ? parseFloat((((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1))
    : 0;

  res.json({
    success: true,
    stats: {
      revenue:     { total: rev,          thisMonth: revThis,          trend: revTrend },
      orders:      { total: totalOrders,  thisMonth: thisMonthOrders,  trend: ordTrend, pending: pendingOrders },
      customers:   { total: totalCustomers, thisMonth: thisMonthCustomers },
      products:    { total: totalProducts, lowStock: lowStockProducts },
    },
    recentOrders,
  });
};

/* ──────────────────────────────────────────
   @route  GET /api/admin/stats/monthly
   @desc   Monthly revenue + order data (12 months)
   @access Private/Admin
────────────────────────────────────────── */
exports.getMonthlyStats = async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo }, "payment.status": "paid" } },
    {
      $group: {
        _id: {
          year:  { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$pricing.total" },
        orders:  { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const result = data.map(d => ({
    month:   MONTHS[d._id.month - 1],
    year:    d._id.year,
    revenue: d.revenue,
    orders:  d.orders,
  }));

  res.json({ success: true, monthly: result });
};

/* ──────────────────────────────────────────
   @route  GET /api/admin/stats/categories
   @desc   Revenue + units sold by category
   @access Private/Admin
────────────────────────────────────────── */
exports.getCategoryStats = async (req, res) => {
  const data = await Order.aggregate([
    { $match: { "payment.status": "paid" } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "prod",
      },
    },
    { $unwind: "$prod" },
    {
      $group: {
        _id:     "$prod.category",
        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        units:   { $sum: "$items.qty" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  res.json({ success: true, categories: data });
};

/* ──────────────────────────────────────────
   @route  GET /api/admin/users
   @desc   All users (admin)
   @access Private/Admin
────────────────────────────────────────── */
exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = { role: "user" };

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName:  { $regex: search, $options: "i" } },
      { phone:     { $regex: search } },
      { email:     { $regex: search, $options: "i" } },
    ];
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select("-password -otp")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  /* Attach order count per user */
  const usersWithStats = await Promise.all(
    users.map(async u => {
      const [orderCount, totalSpent] = await Promise.all([
        Order.countDocuments({ user: u._id }),
        Order.aggregate([
          { $match: { user: u._id, "payment.status": "paid" } },
          { $group: { _id: null, total: { $sum: "$pricing.total" } } },
        ]),
      ]);
      return { ...u.toObject(), orderCount, totalSpent: totalSpent[0]?.total || 0 };
    })
  );

  res.json({ success: true, total, page: Number(page), users: usersWithStats });
};

/* ──────────────────────────────────────────
   @route  PATCH /api/admin/users/:id/status
   @desc   Activate / deactivate user
   @access Private/Admin
────────────────────────────────────────── */
exports.toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404);
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, isActive: user.isActive });
};
