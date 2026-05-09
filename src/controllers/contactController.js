const Contact = require("../models/Contact");
const FAQ = require("../models/FAQ");
const Store = require("../models/Store");

/* ─────────────────────────────────────────
   CONTACT FORM
───────────────────────────────────────── */

// POST /api/contact
exports.submitContact = async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: "Name, phone and message are required." });
    }

    const contact = await Contact.create({ name, phone, email, subject, message });

    return res.status(201).json({
      success: true,
      message: "Thank you! We'll get back to you within 24 hours.",
      data: { id: contact._id },
    });
  } catch (err) {
    console.error("Contact submit error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};

// GET /api/contact  — all submissions (admin)
exports.getAllContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Contact.countDocuments(filter),
    ]);

    return res.json({ success: true, total, page: Number(page), contacts });
  } catch (err) {
    console.error("Contact fetch error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PATCH /api/contact/:id/status  — (admin)
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "read", "replied", "closed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: "Not found." });

    return res.json({ success: true, contact });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ─────────────────────────────────────────
   FAQs
───────────────────────────────────────── */

// GET /api/contact/faqs  — public
exports.getFaqs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, faqs });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/contact/faqs  — (admin)
exports.createFaq = async (req, res) => {
  try {
    const { question, answer, order } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: "Question and answer required." });
    }

    const faq = await FAQ.create({ question, answer, order: order ?? 0 });
    return res.status(201).json({ success: true, faq });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/contact/faqs/:id  — (admin)
exports.updateFaq = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!faq) return res.status(404).json({ success: false, message: "Not found." });

    return res.json({ success: true, faq });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/contact/faqs/:id  — (admin)
exports.deleteFaq = async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "FAQ deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ─────────────────────────────────────────
   STORES
───────────────────────────────────────── */

// GET /api/contact/stores  — public
exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, stores });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/contact/stores  — (admin)
exports.createStore = async (req, res) => {
  try {
    const { city, address, phone, hours, mapEmbedUrl, order } = req.body;
    if (!city || !address || !phone || !hours) {
      return res.status(400).json({
        success: false,
        message: "city, address, phone and hours are required.",
      });
    }

    const store = await Store.create({ city, address, phone, hours, mapEmbedUrl, order: order ?? 0 });
    return res.status(201).json({ success: true, store });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/contact/stores/:id  — (admin)
exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!store) return res.status(404).json({ success: false, message: "Not found." });

    return res.json({ success: true, store });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/contact/stores/:id  — (admin)
exports.deleteStore = async (req, res) => {
  try {
    await Store.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Store deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ─────────────────────────────────────────
   SEED  — POST /api/contact/seed
───────────────────────────────────────── */
exports.seedData = async (req, res) => {
  try {
    await FAQ.deleteMany({});
    await Store.deleteMany({});

    await FAQ.insertMany([
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
    ]);

    await Store.insertMany([
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
    ]);

    return res.json({ success: true, message: "Seed complete — FAQs and Stores inserted." });
  } catch (err) {
    console.error("Seed error:", err);
    return res.status(500).json({ success: false, message: "Seed failed." });
  }
};