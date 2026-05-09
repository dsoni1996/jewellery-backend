require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Product  = require("../models/Product");
const User     = require("../models/User");
const { Coupon } = require("../models/Cart");
const FAQ = require("../models/FAQ");
const Store = require("../models/Store");

/* ── Sample products matching the frontend data structure ── */
const products = [
  {
    sku: "TAN-RNG-001",
    name: "Delicate Details Gold Finger Ring",
    slug: "delicate-details-gold-finger-ring",
    description: "A delicate 22KT gold ring with intricate floral engravings. Lightweight and perfect for daily wear.",
    category: "Ring", subCategory: "Gold Ring",
    occasion: ["Daily", "Festive"],
    price: { current: 15957, original: null, currency: "INR", discountPercent: 0 },
    images: ["https://picsum.photos/400/400?random=1", "https://picsum.photos/400/400?random=11"],
    thumbnail: "https://picsum.photos/400/400?random=1",
    metal: { type: "Yellow Gold", purity: "22KT", weight: 3.8, colour: "Yellow" },
    stones: null,
    variants: { sizes: [10, 12, 14, 16], colors: ["Yellow Gold"] },
    inventory: { inStock: true, quantity: 15 },
    rating: 4.2, reviewCount: 58,
    isNewArrival: true, isBestSeller: false, isFeatured: false,
    makingCharges: 2800,
    certification: "BIS Hallmarked",
  },
  {
    sku: "TAN-RNG-002",
    name: "Timeless Blossom Diamond Finger Ring",
    slug: "timeless-blossom-diamond-finger-ring",
    description: "Stunning 18KT rose gold ring set with a 0.35ct round brilliant diamond. Comes with IGI certificate.",
    category: "Ring", subCategory: "Diamond Ring",
    occasion: ["Engagement", "Wedding", "Festive"],
    price: { current: 66687, original: 71643, currency: "INR", discountPercent: 7 },
    images: ["https://picsum.photos/400/400?random=2", "https://picsum.photos/400/400?random=12"],
    thumbnail: "https://picsum.photos/400/400?random=2",
    metal: { type: "Rose Gold", purity: "18KT", weight: 4.25, colour: "Rose" },
    stones: { type: "Diamond", weight: 0.35, shape: "Round", clarity: "VVS2", certification: "IGI" },
    variants: { sizes: [12, 14, 16, 18], colors: ["Rose Gold", "White Gold"] },
    inventory: { inStock: true, quantity: 8 },
    rating: 4.8, reviewCount: 128,
    isBestSeller: true, isNewArrival: false, isFeatured: true,
    offerText: "20% off on stone charges",
    makingCharges: 9200,
    certification: "IGI Certified",
    features: { tryAtHome: true, similarAvailable: true },
  },
  {
    sku: "TAN-RNG-003",
    name: "Intricate Gold Finger Ring",
    slug: "intricate-gold-finger-ring",
    description: "Heavily crafted 22KT gold ring with Rajasthani temple-inspired motifs. A collector's piece.",
    category: "Ring", subCategory: "Gold Ring",
    occasion: ["Wedding", "Festive"],
    price: { current: 105307, original: null, currency: "INR", discountPercent: 0 },
    images: ["https://picsum.photos/400/400?random=3", "https://picsum.photos/400/400?random=13"],
    thumbnail: "https://picsum.photos/400/400?random=3",
    metal: { type: "Yellow Gold", purity: "22KT", weight: 7.9, colour: "Yellow" },
    variants: { sizes: [14, 16, 18, 20], colors: ["Yellow Gold"] },
    inventory: { inStock: true, quantity: 5 },
    rating: 4.5, reviewCount: 72,
    makingCharges: 14000, certification: "BIS Hallmarked",
  },
  {
    sku: "TAN-RNG-004",
    name: "Elegant White Gold Diamond Ring",
    slug: "elegant-white-gold-diamond-ring",
    description: "18KT white gold ring featuring a princess-cut diamond of 0.42ct. Clean, modern, luxurious.",
    category: "Ring", subCategory: "Diamond Ring",
    occasion: ["Engagement", "Reception", "Daily"],
    price: { current: 84500, original: 92000, currency: "INR", discountPercent: 8 },
    images: ["https://picsum.photos/400/400?random=4", "https://picsum.photos/400/400?random=14"],
    thumbnail: "https://picsum.photos/400/400?random=4",
    metal: { type: "White Gold", purity: "18KT", weight: 5.1, colour: "White" },
    stones: { type: "Diamond", weight: 0.42, shape: "Princess", clarity: "VS1", certification: "IGI" },
    variants: { sizes: [12, 14, 16], colors: ["White Gold"] },
    inventory: { inStock: true, quantity: 6 },
    rating: 4.7, reviewCount: 95,
    isBestSeller: true, isFeatured: true,
    offerText: "Flat ₹7500 off",
    makingCharges: 11500, certification: "IGI Certified",
    features: { tryAtHome: true },
  },
  {
    sku: "TAN-RNG-005",
    name: "Minimalist Rose Gold Ring",
    slug: "minimalist-rose-gold-ring",
    description: "Sleek 18KT rose gold band — perfect for stacking or wearing alone for an effortless look.",
    category: "Ring", subCategory: "Plain Gold Ring",
    occasion: ["Daily", "Party"],
    price: { current: 22500, original: null, currency: "INR", discountPercent: 0 },
    images: ["https://picsum.photos/400/400?random=5", "https://picsum.photos/400/400?random=15"],
    thumbnail: "https://picsum.photos/400/400?random=5",
    metal: { type: "Rose Gold", purity: "18KT", weight: 3.2, colour: "Rose" },
    variants: { sizes: [10, 12, 14], colors: ["Rose Gold"] },
    inventory: { inStock: true, quantity: 20 },
    rating: 4.1, reviewCount: 34,
    isNewArrival: true, makingCharges: 3200, certification: "BIS Hallmarked",
  },
  /* ── Bridal / Wedding pieces ── */
  {
    sku: "MAN-NEC-001",
    name: "Aakarshan Gold Necklace",
    slug: "aakarshan-gold-necklace",
    description: "A golden embrace, a symbol of grace. Hand-crafted in 22KT yellow gold by master artisans. Features intricate Meenakari enamel work.",
    category: "Necklace", subCategory: "Gold Necklace",
    occasion: ["Wedding", "Festive"],
    isWedding: true,
    price: { current: 112732, original: 124000, currency: "INR", discountPercent: 9 },
    images: ["https://picsum.photos/600/700?random=201", "https://picsum.photos/600/700?random=202"],
    thumbnail: "https://picsum.photos/600/700?random=201",
    metal: { type: "Yellow Gold", purity: "22KT", weight: 74.09, colour: "Yellow" },
    variants: { sizes: [], colors: ["Yellow Gold"] },
    inventory: { inStock: true, quantity: 3 },
    rating: 4.7, reviewCount: 128,
    isBestSeller: true, isFeatured: true,
    makingCharges: 14200, certification: "BIS Hallmarked",
  },
  {
    sku: "MAN-BAN-001",
    name: "Floral Gold Bangle Set",
    slug: "floral-gold-bangle-set",
    description: "Set of 4 hand-engraved 22KT gold bangles with delicate floral motifs. A timeless bridal staple.",
    category: "Bangle", subCategory: "Gold Bangle",
    occasion: ["Wedding", "Mehendi", "Festive"],
    isWedding: true,
    price: { current: 87450, original: 95000, currency: "INR", discountPercent: 8 },
    images: ["https://picsum.photos/600/700?random=214", "https://picsum.photos/600/700?random=215"],
    thumbnail: "https://picsum.photos/600/700?random=214",
    metal: { type: "Yellow Gold", purity: "22KT", weight: 56.0, colour: "Yellow" },
    variants: { sizes: [2.4, 2.6, 2.8], colors: ["Yellow Gold"] },
    inventory: { inStock: true, quantity: 4 },
    rating: 4.8, reviewCount: 204,
    isBestSeller: true, isFeatured: true,
    makingCharges: 11800, certification: "BIS Hallmarked",
  },
  {
    sku: "MAN-MNG-001",
    name: "Diamond Mangalsutra",
    slug: "diamond-mangalsutra",
    description: "Contemporary mangalsutra with VS clarity diamonds set between traditional black bead strands.",
    category: "Mangalsutra", subCategory: "Diamond Mangalsutra",
    occasion: ["Wedding"],
    isWedding: true,
    price: { current: 98500, original: 112000, currency: "INR", discountPercent: 12 },
    images: ["https://picsum.photos/600/700?random=208", "https://picsum.photos/600/700?random=209"],
    thumbnail: "https://picsum.photos/600/700?random=208",
    metal: { type: "Yellow Gold", purity: "18KT", weight: 9.8, colour: "Yellow & Black" },
    stones: { type: "Diamond", weight: 0.45, shape: "Round", clarity: "VS2" },
    variants: { sizes: [], colors: ["Yellow Gold"] },
    inventory: { inStock: true, quantity: 6 },
    rating: 4.9, reviewCount: 421,
    isBestSeller: true, isFeatured: true,
    makingCharges: 13500, certification: "BIS Hallmarked",
    features: { tryAtHome: true },
  },
];

/* ── Sample coupons ── */
const coupons = [
  {
    code: "MANAS5",
    description: "5% off on all orders",
    discountType: "percent",
    discountValue: 5,
    minOrderValue: 10000,
    maxDiscount: 5000,
    validUntil: new Date("2026-12-31"),
  },
  {
    code: "BRIDAL10",
    description: "10% off on bridal orders above ₹1 Lakh",
    discountType: "percent",
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 20000,
    validUntil: new Date("2026-12-31"),
  },
  {
    code: "FLAT2000",
    description: "Flat ₹2000 off",
    discountType: "flat",
    discountValue: 2000,
    minOrderValue: 25000,
    validUntil: new Date("2026-12-31"),
  },
];

/* ── Admin user ── */
const adminUser = {
  firstName: "Admin",
  lastName: "MANAS",
  phone: "9000000000",
  email: "admin@manasjewellery.com",
  password: "Admin@123",
  role: "admin",
  isVerified: true,
};


const faq = [
      {
        order: 1,
        question: "What is BIS hallmarking and do all your products have it?",
        answer: "BIS (Bureau of Indian Standards) hallmarking is a government certification that guarantees the purity of gold jewellery. Yes, every single piece at MANAS is BIS hallmarked — no exceptions. The hallmark includes the purity grade (22KT, 18KT, etc.), assay centre mark, and year of marking.",
      },
      {
        order: 2,
        question: "Can I exchange or return jewellery?",
        answer: "Yes! We offer lifetime exchange on all gold jewellery at current gold rates. For returns, we accept unused pieces within 7 days with original packaging and bill. Diamond jewellery can be exchanged within 30 days.",
      },
      {
        order: 3,
        question: "Do you offer jewellery repair and cleaning services?",
        answer: "Absolutely. We offer free cleaning for pieces bought at MANAS. Repair services are available at nominal charges. Just walk into any MANAS store with your original bill.",
      },
      {
        order: 4,
        question: "How long does home delivery take?",
        answer: "We deliver across India. Standard delivery takes 5–7 business days. For bridal orders or customised pieces, please allow 15–21 days. All orders are fully insured and dispatched in tamper-proof packaging.",
      },
      {
        order: 5,
        question: "Can I get jewellery customised or engraved?",
        answer: "Yes, we love customisation! You can personalise pieces with names, initials, or special dates. Engraving is available on most rings, bangles, and pendants. Visit any store or contact us to discuss your requirements.",
      },
      {
        order: 6,
        question: "Is my online payment secure?",
        answer: "Completely. We use 256-bit SSL encryption and support all major payment methods — UPI, credit/debit cards, net banking, and 0% EMI on select cards. We never store your payment details.",
      },
    ]


const storeData = [
      {
        order: 1,
        city: "Indore (HQ)",
        address: "42, MG Road, Indore – 452001",
        phone: "+91 731 421 0000",
        hours: "10:30 AM – 9:00 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7407.752705241804!2d76.33854669357912!3d21.823707800000015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd81b6e5f3f7d71%3A0x774fab255715b69f!2sSarafa%20Market%20-%20Jewellery%20Market!5e0!3m2!1sen!2sin!4v1776925435340!5m2!1sen!2sin",
      },
      {
        order: 2,
        city: "Indore (Vijay Nagar)",
        address: "12, Scheme 54, Vijay Nagar, Indore – 452010",
        phone: "+91 731 421 0001",
        hours: "10:30 AM – 9:00 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7407.752705241804!2d76.33854669357912!3d21.823707800000015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd81b6e5f3f7d71%3A0x774fab255715b69f!2sSarafa%20Market%20-%20Jewellery%20Market!5e0!3m2!1sen!2sin!4v1776925435340!5m2!1sen!2sin",
      },
    ]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    /* Clear */
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await FAQ.deleteMany({});
    await Store.deleteMany({});
    console.log("🗑  Cleared existing data");

    /* Insert */
    const inserted = await Product.insertMany(products);
    console.log(`✅ Seeded ${inserted.length} products`);

    await Coupon.insertMany(coupons);
    console.log(`✅ Seeded ${coupons.length} coupons`);

    await FAQ.insertMany(faq);
    console.log(`✅ Seeded ${faq.length} FAQs`);

    await Store.insertMany(storeData);
    console.log(`✅ Seeded ${storeData.length} stores`);

    /* Admin user */
    const exists = await User.findOne({ phone: adminUser.phone });
    if (!exists) {
      await User.create(adminUser);
      console.log("✅ Admin user created  →  phone: 9000000000 | password: Admin@123");
    } else {
      console.log("ℹ  Admin user already exists");
    }

    console.log("\n🎉 Seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
