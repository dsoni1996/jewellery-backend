const express = require("express");
const router = express.Router();
const {
  submitContact,
  getAllContacts,
  updateContactStatus,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  getStores,
  createStore,
  updateStore,
  deleteStore,
  seedData,
} = require("../controllers/contactController");

/* ── Contact Form ── */
router.post("/",             submitContact);
router.get("/",              getAllContacts);
router.patch("/:id/status",  updateContactStatus);

/* ── FAQs ── */
router.get("/faqs",          getFaqs);
router.post("/faqs",         createFaq);
router.put("/faqs/:id",      updateFaq);
router.delete("/faqs/:id",   deleteFaq);

/* ── Stores ── */
router.get("/stores",        getStores);
router.post("/stores",       createStore);
router.put("/stores/:id",    updateStore);
router.delete("/stores/:id", deleteStore);

/* ── Seed (run once) ── */
router.post("/seed",         seedData);

module.exports = router;