const express = require("express");
const router = express.Router();
const { 
  registerUser, loginUser, getProfile, updateProfile, 
  registerDeliveryPartner, getAllPartners, updatePartnerStatus,
  requestVehicleUpdate, handleVehicleApproval,
  getAllUsers
} = require("../controllers/userController");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/register-delivery", registerDeliveryPartner);
router.get("/profile", authMiddleware, getProfile);
router.patch("/profile", authMiddleware, updateProfile);

// Delivery Partner Routes
router.patch("/vehicle-request", authMiddleware, requestVehicleUpdate);

// Admin Partner Management
router.get("/partners", authMiddleware, adminMiddleware, getAllPartners);
router.get("/all", authMiddleware, adminMiddleware, getAllUsers);
router.patch("/partner-status", authMiddleware, adminMiddleware, updatePartnerStatus);
router.patch("/vehicle-handle", authMiddleware, adminMiddleware, handleVehicleApproval);




module.exports = router;