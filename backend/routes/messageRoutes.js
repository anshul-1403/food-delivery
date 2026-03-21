const express = require("express");
const router = express.Router();
const {
  sendMessage,
  customerReply,
  getMyMessages,
  getAllMessages,
  replyToMessage,
  requestClose,
  confirmClose,
  declineClose,
  markAsRead,
} = require("../controllers/messageController");

const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

// Customer routes
router.post("/messages", authMiddleware, sendMessage);
router.post("/messages/:messageId/reply/customer", authMiddleware, customerReply);
router.get("/messages/mine", authMiddleware, getMyMessages);

// Admin routes
router.get("/messages/all", authMiddleware, adminMiddleware, getAllMessages);
router.post("/messages/:messageId/reply", authMiddleware, adminMiddleware, replyToMessage);
router.post("/messages/:messageId/mark-read", authMiddleware, adminMiddleware, markAsRead);

// Close conversation — both sides
router.post("/messages/:messageId/close-request", authMiddleware, requestClose);
router.post("/messages/:messageId/confirm-close", authMiddleware, confirmClose);
router.post("/messages/:messageId/decline-close", authMiddleware, declineClose);


module.exports = router;
