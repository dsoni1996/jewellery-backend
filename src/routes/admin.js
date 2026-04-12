const express  = require("express");
const router   = express.Router();
const { protect, authorise } = require("../middleware/auth");
const ctrl = require("../controllers/adminController");

const adminOnly = [protect, authorise("admin")];

router.get("/stats",            ...adminOnly, ctrl.getSummaryStats);
router.get("/stats/monthly",    ...adminOnly, ctrl.getMonthlyStats);
router.get("/stats/categories", ...adminOnly, ctrl.getCategoryStats);
router.get("/users",            ...adminOnly, ctrl.getAllUsers);
router.patch("/users/:id/status", ...adminOnly, ctrl.toggleUserStatus);

module.exports = router;
