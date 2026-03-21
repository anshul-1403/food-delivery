const express = require("express");
const router = express.Router();
const { 
  getOrderChat, 
  sendOrderChatMessage,
  requestCloseChat,
  confirmCloseChat,
  declineCloseChat
} = require("../controllers/orderChatController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/order-chat/:orderId", authMiddleware, getOrderChat);
router.post("/order-chat/:orderId/message", authMiddleware, sendOrderChatMessage);
router.post("/order-chat/:orderId/request-close", authMiddleware, requestCloseChat);
router.post("/order-chat/:orderId/confirm-close", authMiddleware, confirmCloseChat);
router.post("/order-chat/:orderId/decline-close", authMiddleware, declineCloseChat);

module.exports = router;

