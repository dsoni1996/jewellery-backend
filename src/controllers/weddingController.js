const WeddingConfig = require("../models/WeddingConfig");
const Product = require("../models/Product");

/* ════════════════════════════════════════════
   PUBLIC  GET /api/wedding/config
   Returns visible slides, steps, testimonials
════════════════════════════════════════════ */
exports.getConfig = async (req, res) => {
  const doc = await WeddingConfig.findOne();

  if (!doc) {
    return res.json({
      success: true,
      heroSlides:   [],
      journeySteps: [],
      testimonials: [],
      updatedAt:    null,
    });
  }

  res.json({
    success:      true,
    heroSlides:   doc.heroSlides.filter(s => s.visible).sort((a, b) => a.order - b.order),
    journeySteps: doc.journeySteps.sort((a, b) => a.order - b.order),
    testimonials: doc.testimonials.filter(t => t.visible).sort((a, b) => a.order - b.order),
    updatedAt:    doc.updatedAt,
  });
};


exports.getConfigAdmin = async (req, res) => {
  const doc = await WeddingConfig.findOne();

  if (!doc) {
    return res.json({
      success:      true,
      heroSlides:   [],
      journeySteps: [],
      testimonials: [],
    });
  }

  res.json({ success: true, ...doc.toObject() });
};


exports.saveConfig = async (req, res) => {
  const { heroSlides, journeySteps, testimonials } = req.body;

  const doc = await WeddingConfig.findOneAndUpdate(
    {},
    {
      $set: {
        heroSlides:   (heroSlides   || []).map((s, i) => ({ ...s, order: i })),
        journeySteps: (journeySteps || []).map((s, i) => ({ ...s, order: i })),
        testimonials: (testimonials || []).map((s, i) => ({ ...s, order: i })),
        updatedBy:    req.user?._id,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({ success: true, message: "Wedding page config saved", config: doc });
};


exports.resetConfig = async (req, res) => {
  await WeddingConfig.deleteMany({});
  res.json({ success: true, message: "Config cleared. All sections are now empty." });
};


exports.getWeddingProducts = async (req, res) => {
  const { occasion, category, purity, sort = "rating", page = 1, limit = 12 } = req.query;

  const filter = { isWedding: true, isActive: true };
  if (occasion) filter.occasion          = { $in: [occasion] };
  if (category) filter.category          = category;
  if (purity)   filter["metal.purity"]   = purity;

  const sortMap = {
    rating:     { rating: -1 },
    price_asc:  { "price.current": 1 },
    price_desc: { "price.current": -1 },
    newest:     { createdAt: -1 },
  };
  const sortObj = sortMap[sort] || { rating: -1 };

  const skip     = (Number(page) - 1) * Number(limit);
  const total    = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .select("name slug thumbnail images price metal occasion category pieces piecesList badge description rating reviewCount isBestSeller isNewArrival isFeatured isWedding isActive inventory")
    .sort(sortObj)
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success:  true,
    products,
    total,
    page:     Number(page),
    pages:    Math.ceil(total / Number(limit)),
  });
};


exports.seedWeddingProducts = async (req, res) => {
  const PRODUCTS = [
    {
      sku: "MAN-WED-001", slug: "rani-haar-bridal-set",
      name: "Rani Haar Bridal Set", isWedding: true,
      occasion: ["wedding"], category: "Necklace",
      description: "A statement bridal set crafted in 22KT gold, adorned with hand-set polki diamonds and meenakari enamel work. Made for the bride who commands every room.",
      thumbnail: "https://picsum.photos/600/700?random=201",
      images: ["https://picsum.photos/600/700?random=201","https://picsum.photos/600/700?random=202","https://picsum.photos/600/700?random=203"],
      price: { current: 524000, original: 578000 },
      metal: { type: "Yellow Gold", purity: "22KT", weight: 98.4 },
      pieces: 5, piecesList: "Necklace · Earrings · Maang Tikka · Nose Ring · Bangles",
      badge: "Bestseller", rating: 4.9, reviewCount: 312,
      isBestSeller: true, isNewArrival: false, isFeatured: true, isActive: true,
      inventory: { quantity: 3, inStock: true },
    },
    {
      sku: "MAN-WED-002", slug: "solitaire-engagement-ring",
      name: "Solitaire Engagement Ring", isWedding: true,
      occasion: ["engagement"], category: "Ring",
      description: "A 1.2 ct VVS2 round brilliant diamond set in an 18KT white gold cathedral mount. Certified by IGI. The ring she has always imagined.",
      thumbnail: "https://picsum.photos/600/700?random=204",
      images: ["https://picsum.photos/600/700?random=204","https://picsum.photos/600/700?random=205"],
      price: { current: 185000, original: 185000 },
      metal: { type: "White Gold", purity: "18KT", weight: 4.2 },
      pieces: 1, piecesList: "Ring",
      badge: "New", rating: 4.8, reviewCount: 246,
      isBestSeller: false, isNewArrival: true, isFeatured: true, isActive: true,
      inventory: { quantity: 8, inStock: true },
    },
    {
      sku: "MAN-WED-003", slug: "floral-meenakari-choker",
      name: "Floral Meenakari Choker", isWedding: true,
      occasion: ["mehendi", "sangeet"], category: "Necklace",
      description: "Vivid meenakari enamel flowers in turquoise and coral set in a 22KT gold choker. Perfect for the colourful celebrations before the big day.",
      thumbnail: "https://picsum.photos/600/700?random=206",
      images: ["https://picsum.photos/600/700?random=206","https://picsum.photos/600/700?random=207"],
      price: { current: 236000, original: 258000 },
      metal: { type: "Yellow Gold", purity: "22KT", weight: 42.6 },
      pieces: 3, piecesList: "Choker · Earrings · Maang Tikka",
      badge: "Limited", rating: 4.7, reviewCount: 189,
      isBestSeller: false, isNewArrival: false, isFeatured: true, isActive: true,
      inventory: { quantity: 5, inStock: true },
    },
    {
      sku: "MAN-WED-004", slug: "diamond-mangalsutra",
      name: "Diamond Mangalsutra", isWedding: true,
      occasion: ["wedding"], category: "Mangalsutra",
      description: "Contemporary mangalsutra with VS clarity diamonds set between traditional black bead strands. A timeless symbol reimagined for the modern bride.",
      thumbnail: "https://picsum.photos/600/700?random=208",
      images: ["https://picsum.photos/600/700?random=208","https://picsum.photos/600/700?random=209"],
      price: { current: 98500, original: 112000 },
      metal: { type: "Yellow Gold", purity: "18KT", weight: 9.8 },
      pieces: 1, piecesList: "Mangalsutra",
      badge: "Bestseller", rating: 4.9, reviewCount: 421,
      isBestSeller: true, isNewArrival: false, isFeatured: true, isActive: true,
      inventory: { quantity: 12, inStock: true },
    },
    {
      sku: "MAN-WED-005", slug: "kundan-polki-necklace-set",
      name: "Kundan Polki Necklace Set", isWedding: true,
      occasion: ["sangeet", "reception"], category: "Necklace",
      description: "Uncut polki diamonds set in the classic Kundan technique. Each stone hand-placed by our artisans over 120 hours of careful craftsmanship.",
      thumbnail: "https://picsum.photos/600/700?random=210",
      images: ["https://picsum.photos/600/700?random=210","https://picsum.photos/600/700?random=211"],
      price: { current: 368000, original: 395000 },
      metal: { type: "Yellow Gold", purity: "22KT", weight: 68.2 },
      pieces: 4, piecesList: "Necklace · Earrings · Maang Tikka · Ring",
      badge: null, rating: 4.8, reviewCount: 178,
      isBestSeller: false, isNewArrival: false, isFeatured: false, isActive: true,
      inventory: { quantity: 4, inStock: true },
    },
    {
      sku: "MAN-WED-006", slug: "pearl-diamond-reception-set",
      name: "Pearl & Diamond Reception Set", isWedding: true,
      occasion: ["reception"], category: "Necklace",
      description: "South Sea pearls paired with diamond pavé in 18KT white gold. Understated luxury for the reception evening when you want to shine differently.",
      thumbnail: "https://picsum.photos/600/700?random=212",
      images: ["https://picsum.photos/600/700?random=212","https://picsum.photos/600/700?random=213"],
      price: { current: 295000, original: 295000 },
      metal: { type: "White Gold", purity: "18KT", weight: 22.4 },
      pieces: 3, piecesList: "Necklace · Earrings · Bracelet",
      badge: "Exclusive", rating: 4.6, reviewCount: 134,
      isBestSeller: false, isNewArrival: false, isFeatured: false, isActive: true,
      inventory: { quantity: 6, inStock: true },
    },
    {
      sku: "MAN-WED-007", slug: "gold-kada-bangle-set",
      name: "Gold Kada Bangle Set", isWedding: true,
      occasion: ["mehendi", "honeymoon"], category: "Bangle",
      description: "A set of six hand-engraved gold kadas with delicate floral motifs. Stack them together or wear one — beautiful either way.",
      thumbnail: "https://picsum.photos/600/700?random=214",
      images: ["https://picsum.photos/600/700?random=214","https://picsum.photos/600/700?random=215"],
      price: { current: 312000, original: 340000 },
      metal: { type: "Yellow Gold", purity: "22KT", weight: 56.0 },
      pieces: 6, piecesList: "6 Bangles",
      badge: null, rating: 4.7, reviewCount: 267,
      isBestSeller: false, isNewArrival: false, isFeatured: false, isActive: true,
      inventory: { quantity: 10, inStock: true },
    },
    {
      sku: "MAN-WED-008", slug: "emerald-gold-haath-phool",
      name: "Emerald Gold Haath Phool", isWedding: true,
      occasion: ["wedding", "reception"], category: "Haath Phool",
      description: "Colombian emerald centre stones surrounded by diamond halos on a gold hand-chain. The finishing touch that makes the bridal look complete.",
      thumbnail: "https://picsum.photos/600/700?random=216",
      images: ["https://picsum.photos/600/700?random=216","https://picsum.photos/600/700?random=217"],
      price: { current: 124000, original: 138000 },
      metal: { type: "Yellow Gold", purity: "22KT", weight: 18.6 },
      pieces: 2, piecesList: "Hand Harness (pair)",
      badge: "New", rating: 4.5, reviewCount: 98,
      isBestSeller: false, isNewArrival: true, isFeatured: false, isActive: true,
      inventory: { quantity: 7, inStock: true },
    },
  ];

  const deleted  = await Product.deleteMany({ isWedding: true });
  const inserted = await Product.insertMany(PRODUCTS);

  res.json({
    success:  true,
    message:  `Seeded ${inserted.length} wedding products (removed ${deleted.deletedCount} old)`,
    products: inserted.map(p => ({ _id: p._id, name: p.name, slug: p.slug })),
  });
};