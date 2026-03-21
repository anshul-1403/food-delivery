const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrder,
  getAvailableOrders,
  pickupOrder,
  getPartnerOrders,
  completeDelivery,
  requestCancellation,
} = require("../controllers/orderController");


const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

router.post("/orders/request-cancel", authMiddleware, requestCancellation);
router.post("/orders", authMiddleware, createOrder);

router.get("/orders/user", authMiddleware, getUserOrders);
router.get("/orders/all", authMiddleware, getAllOrders);
router.patch("/orders/status", authMiddleware, updateOrderStatus);

// Delivery partner routes — must come BEFORE /orders/:orderId to avoid wildcard clash
router.get("/orders/available", authMiddleware, getAvailableOrders);
router.get("/orders/partner", authMiddleware, getPartnerOrders);
router.post("/orders/pickup", authMiddleware, pickupOrder);
router.post("/orders/complete", authMiddleware, completeDelivery);

// Dynamic route last so it doesn't swallow the static paths above
router.get("/orders/:orderId", authMiddleware, getOrder);

module.exports = router;



