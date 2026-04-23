const NavConfig = require("../models/NavConfig");

/* ── Default config (used when DB is empty) ── */
const DEFAULT_CONFIG = {
  topbar: {
    visible: true,
    text: "FREE SHIPPING ON ORDERS ABOVE ₹50,000 · BIS HALLMARKED JEWELLERY · VISIT OUR STORES",
  },
  navItems: [
    { name: "Brand",        href: "/about",                  visible: true,  order: 0, hasMegaMenu: false },
    { name: "Masterpieces", href: "/listing?sort=rating",    visible: true,  order: 1, hasMegaMenu: false },
    { name: "Jewellery",    href: "/listing",                visible: true,  order: 2, hasMegaMenu: true  },
    { name: "Weddings",     href: "/wedding",                visible: true,  order: 3, hasMegaMenu: false },
    { name: "Occasions",    href: "/listing?occasion=Festive",visible: true, order: 4, hasMegaMenu: false },
    { name: "Gold Rate",    href: "/gold-rate",              visible: true,  order: 5, hasMegaMenu: false },
    { name: "Store",        href: "/contact",                visible: true,  order: 6, hasMegaMenu: false },
  ],
  megaCols: [
    {
      title: "By Category", order: 0, highlightLast: false,
      items: [
        { label: "Earrings",     href: "/listing?category=Earring",     visible: true },
        { label: "Rings",        href: "/listing?category=Ring",        visible: true },
        { label: "Necklaces",    href: "/listing?category=Necklace",    visible: true },
        { label: "Bangles",      href: "/listing?category=Bangle",      visible: true },
        { label: "Mangalsutras", href: "/listing?category=Mangalsutra", visible: true },
      ],
    },
    {
      title: "", order: 1, highlightLast: true,
      items: [
        { label: "Pendants",      href: "/listing?category=Pendant",   visible: true },
        { label: "Bracelets",     href: "/listing?category=Bracelet",  visible: true },
        { label: "Chains",        href: "/listing?category=Chain",     visible: true },
        { label: "Coins",         href: "/listing?category=Other",     visible: true },
        { label: "All Jewellery", href: "/listing",                    visible: true },
      ],
    },
    {
      title: "By Metal", order: 2, highlightLast: false,
      items: [
        { label: "Gold Jewellery",    href: "/listing?metal=Gold",    visible: true },
        { label: "Diamond Jewellery", href: "/listing?purity=18KT",   visible: true },
        { label: "Polki Jewellery",   href: "/listing?style=Polki",   visible: true },
      ],
    },
    {
      title: "By Karatage", order: 3, highlightLast: false,
      items: [
        { label: "14KT", href: "/listing?purity=14KT", visible: true },
        { label: "18KT", href: "/listing?purity=18KT", visible: true },
        { label: "22KT", href: "/listing?purity=22KT", visible: true },
        { label: "24KT", href: "/listing?purity=24KT", visible: true },
      ],
    },
  ],
  megaImgs: [
    { src: "https://www.tanishq.co.in/dw/image/v2/BKCK_PRD/on/demandware.static/-/Library-Sites-TanishqSharedLibrary/default/dw2562a9fe/homepage/shopByCategory/rings-cat.jpg",    alt: "Rings",    href: "/listing?category=Ring",   visible: true, order: 0 },
    { src: "https://www.tanishq.co.in/dw/image/v2/BKCK_PRD/on/demandware.static/-/Library-Sites-TanishqSharedLibrary/default/dw18de0cb1/homepage/shopByCategory/earrings-cat.jpg", alt: "Earrings", href: "/listing?category=Earring", visible: true, order: 1 },
  ],
  searchHints: ["Gold Rings", "Diamond Necklace", "Bangles", "Mangalsutra", "Earrings", "Bridal Sets"],
};

/* ── Helper: get or create single doc ── */
async function getOrCreate() {
  let doc = await NavConfig.findOne();
  if (!doc) {
    doc = await NavConfig.create(DEFAULT_CONFIG);
  }
  return doc;
}

/* ──────────────────────────────────────────
   @route  GET /api/nav
   @desc   Public — returns full nav config (filtered visible only)
   @access Public
────────────────────────────────────────── */
exports.getNav = async (req, res) => {
  const doc = await getOrCreate();

  /* Filter only visible items for public */
  const navItems = doc.navItems
    .filter(i => i.visible)
    .sort((a, b) => a.order - b.order);

  const megaCols = doc.megaCols
    .sort((a, b) => a.order - b.order)
    .map(col => ({
      ...col.toObject(),
      items: col.items.filter(i => i.visible),
    }));

  const megaImgs = doc.megaImgs
    .filter(i => i.visible)
    .sort((a, b) => a.order - b.order);

  res.json({
    success: true,
    nav: {
      topbar:      doc.topbar,
      navItems,
      megaCols,
      megaImgs,
      searchHints: doc.searchHints || DEFAULT_CONFIG.searchHints,
    },
    updatedAt: doc.updatedAt,
  });
};

/* ──────────────────────────────────────────
   @route  GET /api/nav/admin
   @desc   Admin — full config including hidden items
   @access Private/Admin
────────────────────────────────────────── */
exports.getNavAdmin = async (req, res) => {
  const doc = await getOrCreate();
  res.json({ success: true, nav: doc.toObject(), updatedAt: doc.updatedAt });
};

/* ──────────────────────────────────────────
   @route  PUT /api/nav
   @desc   Admin — save full nav config
   @access Private/Admin
────────────────────────────────────────── */
exports.saveNav = async (req, res) => {
  const { topbar, navItems, megaCols, megaImgs, searchHints } = req.body;

  /* Re-assign order from array positions */
  const orderedNavItems = (navItems || []).map((item, i) => ({ ...item, order: i }));
  const orderedMegaCols = (megaCols || []).map((col, i) => ({ ...col, order: i }));
  const orderedMegaImgs = (megaImgs || []).map((img, i) => ({ ...img, order: i }));

  const doc = await NavConfig.findOneAndUpdate(
    {},
    {
      topbar:      topbar || {},
      navItems:    orderedNavItems,
      megaCols:    orderedMegaCols,
      megaImgs:    orderedMegaImgs,
      searchHints: searchHints || [],
      updatedBy:   req.user._id,
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({ success: true, nav: doc, message: "Navigation saved successfully" });
};

/* ──────────────────────────────────────────
   @route  POST /api/nav/reset
   @desc   Admin — reset to defaults
   @access Private/Admin
────────────────────────────────────────── */
exports.resetNav = async (req, res) => {
  await NavConfig.deleteMany({});
  const doc = await NavConfig.create({ ...DEFAULT_CONFIG, updatedBy: req.user._id });
  res.json({ success: true, message: "Navigation reset to defaults", nav: doc });
};
