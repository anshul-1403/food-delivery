const mongoose = require("mongoose");

const messageEntrySchema = new mongoose.Schema({
  senderRole: { type: String, enum: ["customer", "admin"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  subject: { type: String, default: "General Enquiry" },
  // All messages in the thread (original + replies from both sides)
  thread: [messageEntrySchema],
  isClosed: { type: Boolean, default: false },
  closeRequestedBy: { type: String, default: null }, // "customer" | "admin" | null
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("message", messageSchema);

