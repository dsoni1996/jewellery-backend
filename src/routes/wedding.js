const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/weddingController");
const { protect, authorise } = require("../middleware/auth");

const admin = [protect, authorise("admin")];

/* ── Public ── */
router.get("/config",          ctrl.getConfig);           // hero slides, journey, testimonials
router.get("/products",        ctrl.getWeddingProducts);  // all bridal products

/* ── Admin ── */
router.get("/config/admin",    ...admin, ctrl.getConfigAdmin);
router.put("/config",          ...admin, ctrl.saveConfig);
router.post("/config/reset",   ...admin, ctrl.resetConfig);
router.post("/seed",           ...admin, ctrl.seedWeddingProducts);

module.exports = router;
