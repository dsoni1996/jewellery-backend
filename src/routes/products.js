const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/productController");
const { protect, authorise } = require("../middleware/auth");

/* Public */
router.get("/",                     ctrl.getProducts);
router.get("/home-sections",        ctrl.getHomeSections);
router.get("/search/suggestions",   ctrl.getSearchSuggestions);
router.get("/:slug",                ctrl.getProduct);

/* Private */
router.post("/:id/reviews", protect, ctrl.addReview);

/* Admin */
router.post  ("/",    protect, authorise("admin"), ctrl.createProduct);
router.put   ("/:id", protect, authorise("admin"), ctrl.updateProduct);
router.delete("/:id", protect, authorise("admin"), ctrl.deleteProduct);

module.exports = router;
