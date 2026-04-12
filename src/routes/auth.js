/* routes/auth.js */
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register",    ctrl.register);
router.post("/login",       ctrl.login);
router.post("/send-otp",    ctrl.sendOtp);
router.post("/verify-otp",  ctrl.verifyOtp);
router.post("/logout",      protect, ctrl.logout);
router.get ("/me",          protect, ctrl.getMe);
router.put ("/me",          protect, ctrl.updateMe);
router.post("/addresses",   protect, ctrl.addAddress);
router.delete("/addresses/:id", protect, ctrl.removeAddress);

module.exports = router;
