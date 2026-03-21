const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  senderRole: { type: String, enum: ["customer", "delivery"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const orderChatSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  messages: [chatMessageSchema],
  isActive: { type: Boolean, default: true },
  closeRequestedBy: { type: String, enum: ["customer", "delivery", null], default: null },
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model("orderchat", orderChatSchema);
