const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/homePageController");
const { protect, authorise } = require("../middleware/auth");

const admin = [protect, authorise("admin")];

/* Public */
router.get("/", ctrl.getHomePage);

/* Admin */
router.get   ("/config",           ...admin, ctrl.getConfig);
router.put   ("/config",           ...admin, ctrl.saveConfig);
router.post  ("/sections",         ...admin, ctrl.addSection);
router.put   ("/sections/:id",     ...admin, ctrl.updateSection);
router.delete("/sections/:id",     ...admin, ctrl.removeSection);
router.post  ("/reset",            ...admin, ctrl.resetToDefault);

module.exports = router;