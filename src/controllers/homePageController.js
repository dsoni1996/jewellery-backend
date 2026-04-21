const HomePage = require("../models/HomePage");
const Product  = require("../models/Product");

/* ── Default sections (used if DB is empty) ── */
const DEFAULT_SECTIONS = [
  {
    id: "hero", type: "hero_carousel", label: "Hero Carousel", visible: true, order: 0,
    settings: {
      slides: [
        { img: "https://www.tanishq.co.in/on/demandware.static/-/Library-Sites-TanishqSharedLibrary/default/dw3fd145e1/homepage/tanishq-collections/sparkling-desktop.jpg", eyebrow: "2025 Bridal Collection", title: "Crafted for Your", titleEm: "Greatest Day", subtitle: "Handcrafted in 22KT & 18KT gold, set with the finest diamonds.", ctaLabel: "Explore Collections", ctaHref: "/listing" },
        { img: "https://www.tanishq.co.in/on/demandware.static/-/Library-Sites-TanishqSharedLibrary/default/dwfba22b76/homepage/tanishq-collections/stunning-every-ear.jpg", eyebrow: "The Engagement Edit", title: "A Promise Set in", titleEm: "Gold & Diamond", subtitle: "Solitaires and couple rings for life's most important moment.", ctaLabel: "Shop Rings", ctaHref: "/listing?category=Ring" },
        { img: "https://www.tanishq.co.in/on/demandware.static/-/Library-Sites-TanishqSharedLibrary/default/dw96c93899/homepage/tanishq-collections/ganesh-chaturthi.jpg", eyebrow: "Heritage Craftsmanship", title: "Timeless Beauty For Your", titleEm: "Every Ritual", subtitle: "Gold jewellery for life's precious occasions.", ctaLabel: "Discover More", ctaHref: "/listing" },
      ],
    },
  },
  {
    id: "collections", type: "collection_grid", label: "Collections Grid", visible: true, order: 1,
    settings: {
      title: "Manas Collections", subtitle: "Explore our newly launched collection",
      collections: [
        { img: "https://www.tanishq.co.in/on/demandware.static/-/Library-Sites-TanishqSharedLibrary/default/dw3fd145e1/homepage/tanishq-collections/sparkling-desktop.jpg", title: "Sparkling Avenues", sub: "Diamond Collection", href: "/listing", span: "large" },
        { img: "https://www.tanishq.co.in/on/demandware.static/-/Library-Sites-TanishqSharedLibrary/default/dwfba22b76/homepage/tanishq-collections/stunning-every-ear.jpg", title: "Stunning Every Ear", sub: "Earring Edit", href: "/listing", span: "small" },
        { img: "https://www.tanishq.co.in/on/demandware.static/-/Library-Sites-TanishqSharedLibrary/default/dw96c93899/homepage/tanishq-collections/ganesh-chaturthi.jpg", title: "Festive Splendour", sub: "Occasion Wear", href: "/listing", span: "small" },
      ],
    },
  },
  { id: "categories", type: "categories",    label: "Shop by Categories", visible: true, order: 2, settings: { showViewAll: true } },
  {
    id: "trending",    type: "trending",       label: "Trending Now",       visible: true, order: 3,
    settings: { title: "Trending Now", subtitle: "Jewellery pieces everyone's eyeing right now", productFilter: { isBestSeller: true, limit: 3 } },
  },
  { id: "trust",      type: "trust_world",    label: "Trust & Brand World", visible: true, order: 4, settings: {} },
  {
    id: "new_arrivals", type: "new_arrivals",  label: "New Arrivals",        visible: true, order: 5,
    settings: { productFilter: { isNewArrival: true, limit: 3 } },
  },
];

/* ── Helper: get or create the single home page doc ── */
async function getOrCreate() {
  let doc = await HomePage.findOne();
  if (!doc) {
    doc = await HomePage.create({ sections: DEFAULT_SECTIONS });
  }
  return doc;
}

/* ──────────────────────────────────────────
   @route  GET /api/homepage
   @desc   Public — returns visible sections + resolved product data
   @access Public
────────────────────────────────────────── */
exports.getHomePage = async (req, res) => {
  const doc = await getOrCreate();

  /* Sort by order, filter visible */
  const sections = doc.sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  /* For sections that need products, fetch them in parallel */
  const productSections = sections.filter(s =>
    ["trending","new_arrivals","product_row"].includes(s.type) && s.settings?.productFilter
  );

  const resolved = await Promise.all(
    productSections.map(async s => {
      const f = s.settings.productFilter;
      const filter = { isActive: true };
      if (f.category)     filter.category = f.category;
      if (f.purity)       filter["metal.purity"] = f.purity;
      if (f.isBestSeller) filter.isBestSeller = true;
      if (f.isNewArrival) filter.isNewArrival = true;
      if (f.isFeatured)   filter.isFeatured   = true;
      if (f.isWedding)    filter.isWedding    = true;
      const products = await Product.find(filter)
        .select("name slug thumbnail price rating reviewCount metal isBestSeller isNewArrival")
        .limit(f.limit || 6)
        .sort({ rating: -1 });
      return { sectionId: s.id, products };
    })
  );

  const productMap = Object.fromEntries(resolved.map(r => [r.sectionId, r.products]));

  /* Attach resolved products to relevant sections */
  const enriched = sections.map(s => ({
    ...s.toObject(),
    products: productMap[s.id] || [],
  }));

  res.json({ success: true, sections: enriched, updatedAt: doc.updatedAt });
};

/* ──────────────────────────────────────────
   @route  GET /api/homepage/config
   @desc   Admin — returns full config (all sections incl hidden)
   @access Private/Admin
────────────────────────────────────────── */
exports.getConfig = async (req, res) => {
  const doc = await getOrCreate();
  res.json({ success: true, sections: doc.sections.sort((a,b) => a.order - b.order), updatedAt: doc.updatedAt });
};

/* ──────────────────────────────────────────
   @route  PUT /api/homepage/config
   @desc   Admin — full sections array replace (reorder + visibility)
   @access Private/Admin
────────────────────────────────────────── */
exports.saveConfig = async (req, res) => {
  const { sections } = req.body;
  if (!Array.isArray(sections)) return res.status(400).json({ success: false, message: "sections array required" });

  /* Re-assign order from array index */
  const ordered = sections.map((s, i) => ({ ...s, order: i }));

  const doc = await getOrCreate();
  doc.sections  = ordered;
  doc.updatedBy = req.user._id;
  await doc.save();

  res.json({ success: true, sections: doc.sections, message: "Home page saved" });
};

/* ──────────────────────────────────────────
   @route  PUT /api/homepage/sections/:id
   @desc   Admin — update a single section's settings
   @access Private/Admin
────────────────────────────────────────── */
exports.updateSection = async (req, res) => {
  const doc     = await getOrCreate();
  const section = doc.sections.find(s => s.id === req.params.id);
  if (!section) return res.status(404).json({ success: false, message: "Section not found" });

  /* Merge settings */
  if (req.body.label   !== undefined) section.label   = req.body.label;
  if (req.body.visible !== undefined) section.visible = req.body.visible;
  if (req.body.settings) {
    section.settings = { ...section.settings.toObject?.() ?? section.settings, ...req.body.settings };
  }

  doc.updatedBy = req.user._id;
  await doc.save();

  res.json({ success: true, section, message: "Section updated" });
};

/* ──────────────────────────────────────────
   @route  POST /api/homepage/sections
   @desc   Admin — add a new section
   @access Private/Admin
────────────────────────────────────────── */
exports.addSection = async (req, res) => {
  const doc = await getOrCreate();
  const newSection = {
    ...req.body,
    order: doc.sections.length,
    visible: req.body.visible ?? true,
  };
  doc.sections.push(newSection);
  doc.updatedBy = req.user._id;
  await doc.save();
  res.status(201).json({ success: true, section: newSection });
};

/* ──────────────────────────────────────────
   @route  DELETE /api/homepage/sections/:id
   @desc   Admin — remove a section
   @access Private/Admin
────────────────────────────────────────── */
exports.removeSection = async (req, res) => {
  const doc = await getOrCreate();
  doc.sections = doc.sections.filter(s => s.id !== req.params.id);
  /* Re-order */
  doc.sections.forEach((s, i) => { s.order = i; });
  doc.updatedBy = req.user._id;
  await doc.save();
  res.json({ success: true, message: "Section removed" });
};

/* ──────────────────────────────────────────
   @route  POST /api/homepage/reset
   @desc   Admin — reset to default sections
   @access Private/Admin
────────────────────────────────────────── */
exports.resetToDefault = async (req, res) => {
  await HomePage.deleteMany({});
  const doc = await HomePage.create({ sections: DEFAULT_SECTIONS, updatedBy: req.user._id });
  res.json({ success: true, message: "Reset to defaults", sections: doc.sections });
};
