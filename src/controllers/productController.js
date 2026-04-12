const Product  = require("../models/Product");
const { AppError } = require("../middleware/error");

/* ──────────────────────────────────────────
   @route  GET /api/products
   @desc   Get all products with filtering, sorting, pagination
   @access Public
   Query params:
     category, purity, minPrice, maxPrice, inStock,
     isBestSeller, isNewArrival, isFeatured, isWedding,
     sort (price_asc|price_desc|rating|newest),
     search, page, limit
────────────────────────────────────────── */
exports.getProducts = async (req, res) => {
  const {
    category, purity, minPrice, maxPrice,
    inStock, isBestSeller, isNewArrival, isFeatured, isWedding,
    sort, search, page = 1, limit = 20,
  } = req.query;

  const filter = { isActive: true };

  if (category)     filter.category = { $in: category.split(",") };
  if (purity)       filter["metal.purity"] = { $in: purity.split(",") };
  if (inStock)      filter["inventory.inStock"] = inStock === "true";
  if (isBestSeller) filter.isBestSeller = true;
  if (isNewArrival) filter.isNewArrival = true;
  if (isFeatured)   filter.isFeatured   = true;
  if (isWedding)    filter.isWedding    = true;

  if (minPrice || maxPrice) {
    filter["price.current"] = {};
    if (minPrice) filter["price.current"].$gte = Number(minPrice);
    if (maxPrice) filter["price.current"].$lte = Number(maxPrice);
  }

  if (search) {
    filter.$text = { $search: search };
  }

  /* Sort map */
  const sortMap = {
    price_asc:  { "price.current": 1 },
    price_desc: { "price.current": -1 },
    rating:     { rating: -1 },
    newest:     { createdAt: -1 },
    default:    { isFeatured: -1, isBestSeller: -1, createdAt: -1 },
  };
  const sortQuery = sortMap[sort] || sortMap.default;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .select("-reviews")
    .sort(sortQuery)
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    count: products.length,
    products,
  });
};

/* ──────────────────────────────────────────
   @route  GET /api/products/:slug
   @desc   Get single product by slug
   @access Public
────────────────────────────────────────── */
exports.getProduct = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate("reviews.user", "firstName lastName avatar");

  if (!product) throw new AppError("Product not found", 404);
  res.json({ success: true, product });
};

/* ──────────────────────────────────────────
   @route  POST /api/products
   @desc   Create product (admin)
   @access Private/Admin
────────────────────────────────────────── */
exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
};

/* ──────────────────────────────────────────
   @route  PUT /api/products/:id
   @desc   Update product (admin)
   @access Private/Admin
────────────────────────────────────────── */
exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!product) throw new AppError("Product not found", 404);
  res.json({ success: true, product });
};

/* ──────────────────────────────────────────
   @route  DELETE /api/products/:id
   @desc   Soft-delete product (admin)
   @access Private/Admin
────────────────────────────────────────── */
exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!product) throw new AppError("Product not found", 404);
  res.json({ success: true, message: "Product deactivated" });
};

/* ──────────────────────────────────────────
   @route  POST /api/products/:id/reviews
   @desc   Add review
   @access Private
────────────────────────────────────────── */
exports.addReview = async (req, res) => {
  const { rating, title, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);

  const alreadyReviewed = product.reviews.find(
    r => r.user.toString() === req.user.id
  );
  if (alreadyReviewed) throw new AppError("You have already reviewed this product", 400);

  product.reviews.push({ user: req.user.id, name: req.user.fullName, rating, title, comment });
  product.updateRating();
  await product.save();

  res.status(201).json({ success: true, message: "Review added", rating: product.rating, reviewCount: product.reviewCount });
};

/* ──────────────────────────────────────────
   @route  GET /api/products/featured/home
   @desc   Homepage sections data
   @access Public
────────────────────────────────────────── */
exports.getHomeSections = async (req, res) => {
  const [bestSellers, newArrivals, trending, wedding] = await Promise.all([
    Product.find({ isBestSeller: true, isActive: true }).select("-reviews").limit(8),
    Product.find({ isNewArrival: true, isActive: true }).select("-reviews").limit(8).sort({ createdAt: -1 }),
    Product.find({ isActive: true }).select("-reviews").sort({ rating: -1 }).limit(6),
    Product.find({ isWedding: true, isActive: true }).select("-reviews").limit(6),
  ]);

  res.json({ success: true, bestSellers, newArrivals, trending, wedding });
};

/* ──────────────────────────────────────────
   @route  GET /api/products/search/suggestions
   @desc   Search autocomplete suggestions
   @access Public
────────────────────────────────────────── */
exports.getSearchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });

  const products = await Product.find({
    isActive: true,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ],
  }).select("name slug category thumbnail price.current").limit(8);

  res.json({ success: true, suggestions: products });
};
