const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/navController");
const { protect, authorise } = require("../middleware/auth");

const adminOnly = [protect, authorise("admin")];

/* Public */
router.get("/",        ctrl.getNav);

/* Admin */
router.get("/admin",   ...adminOnly, ctrl.getNavAdmin);
router.put("/",        ...adminOnly, ctrl.saveNav);
router.post("/reset",  ...adminOnly, ctrl.resetNav);

module.exports = router;
