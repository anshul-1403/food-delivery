const OrderChat = require("../models/OrderChat");
const Order = require("../models/Order");

// Get or create the chat for an order
const getOrderChat = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only customer or the assigned delivery partner can access
    const isCustomer = order.user.toString() === req.userId;
    const isDelivery = order.deliveryPartner?.toString() === req.userId;
    if (!isCustomer && !isDelivery) {
      return res.status(403).json({ message: "Access denied" });
    }

    const chat = await OrderChat.findOne({ orderId });
    if (!chat) return res.status(404).json({ message: "Chat not started yet" });
    return res.status(200).json(chat);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Send a message in the order chat
const sendOrderChatMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { content, senderRole } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isCustomer = order.user.toString() === req.userId;
    const isDelivery = order.deliveryPartner?.toString() === req.userId;
    if (!isCustomer && !isDelivery) {
      return res.status(403).json({ message: "Access denied" });
    }

    const chat = await OrderChat.findOne({ orderId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.isActive) return res.status(400).json({ message: "Chat is closed" });

    const newMessage = { senderRole, content };
    chat.messages.push(newMessage);
    await chat.save();

    // Emit the message via Socket.IO
    req.io.to(`order_${orderId}`).emit("new_chat_message", {
      orderId,
      message: chat.messages[chat.messages.length - 1],
    });


    return res.status(200).json(chat);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Request to close the chat (e.g. delivery is made)
const requestCloseChat = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { role } = req.body; // 'customer' or 'delivery'

    const chat = await OrderChat.findOne({ orderId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.closeRequestedBy = role;
    await chat.save();

    // Notify room
    req.io.to(`order_${orderId}`).emit("chat_close_request", { orderId, role });

    return res.status(200).json(chat);
  } catch (error) {
    return res.status(500).json({ message: "Error requesting close" });
  }
};

// Confirm closure and Mark Order as Delivered
const confirmCloseChat = async (req, res) => {
  try {
    const { orderId } = req.params;
    const chat = await OrderChat.findOne({ orderId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.isActive = false;
    chat.closeRequestedBy = null;
    await chat.save();

    // Mark Order as Delivered
    const order = await Order.findById(orderId);
    if (order) {
      order.status = "Delivered";
      if (order.paymentMethod === "COD") order.paymentStatus = "Paid";
      await order.save();
      // Notify status change
      req.io.to(`order_${orderId}`).emit("order_status_update", order);
      req.io.emit("status_update", order);
    }

    // Notify chat closure
    req.io.to(`order_${orderId}`).emit("chat_closed", { orderId });

    return res.status(200).json(chat);
  } catch (error) {
    return res.status(500).json({ message: "Error confirming close" });
  }
};

const declineCloseChat = async (req, res) => {
  try {
    const { orderId } = req.params;
    const chat = await OrderChat.findOne({ orderId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.closeRequestedBy = null;
    await chat.save();

    // Notify
    req.io.to(`order_${orderId}`).emit("chat_close_declined", { orderId });

    return res.status(200).json(chat);
  } catch (error) {
    return res.status(500).json({ message: "Error declining close" });
  }
};

module.exports = { 
  getOrderChat, 
  sendOrderChatMessage,
  requestCloseChat,
  confirmCloseChat,
  declineCloseChat
};

