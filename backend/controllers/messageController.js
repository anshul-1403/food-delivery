const Message = require("../models/Message");

const sendMessage = async (req, res) => {
  try {
    const { subject, content, targetUserId } = req.body;
    
    // If targetUserId is provided, it means an admin is initiating the chat
    // The "sender" in our model actually acts as the "owner/customer" of the thread
    const threadOwner = targetUserId || req.userId;
    const initialRole = targetUserId ? "admin" : "customer";

    const msg = new Message({
      sender: threadOwner,
      subject,
      thread: [{ senderRole: initialRole, content }],
    });
    
    // If admin initiates, it's already "read" by admin
    if (targetUserId) {
      msg.isRead = true;
    }

    await msg.save();
    
    // Notify all admins about a new thread
    const populated = await msg.populate("sender", "name email");
    req.io.emit("new_message_thread", populated);
    
    return res.status(201).json(populated);
  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// Customer adds a follow-up message to an existing thread
const customerReply = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const msg = await Message.findOne({ _id: messageId, sender: req.userId });
    if (!msg) return res.status(404).json({ message: "Thread not found" });
    if (msg.isClosed) return res.status(400).json({ message: "This conversation is closed" });
    
    const newEntry = { senderRole: "customer", content };
    msg.thread.push(newEntry);
    msg.isRead = false; // mark unread for admin
    await msg.save();
    
    // Notify room
    req.io.to(`message_${messageId}`).emit("new_thread_message", { messageId, entry: msg.thread[msg.thread.length - 1] });
    // Also notify admins list about an update
    req.io.emit("thread_updated", msg);

    return res.status(200).json(msg);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMyMessages = async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Admin replies to a thread
const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Thread not found" });
    if (msg.isClosed) return res.status(400).json({ message: "This conversation is closed" });
    
    const newEntry = { senderRole: "admin", content };
    msg.thread.push(newEntry);
    msg.isRead = true;
    await msg.save();
    const populated = await msg.populate("sender", "name email");
    
    // Notify room
    req.io.to(`message_${messageId}`).emit("new_thread_message", { messageId, entry: msg.thread[msg.thread.length - 1] });

    return res.status(200).json(populated);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Either side requests to close the conversation
const requestClose = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { role } = req.body; // who is requesting
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Thread not found" });
    if (msg.isClosed) return res.status(400).json({ message: "Already closed" });
    msg.closeRequestedBy = role;
    await msg.save();
    
    req.io.to(`message_${messageId}`).emit("message_close_request", { messageId, role });

    return res.status(200).json(msg);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// The other side confirms the close
const confirmClose = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await Message.findByIdAndUpdate(
      messageId,
      { isClosed: true, closeRequestedBy: null },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Thread not found" });
    
    req.io.to(`message_${messageId}`).emit("message_closed", { messageId });

    return res.status(200).json(msg);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// The other side declines the close request
const declineClose = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await Message.findByIdAndUpdate(
      messageId,
      { closeRequestedBy: null },
      { new: true }
    );
    
    req.io.to(`message_${messageId}`).emit("message_close_declined", { messageId });

    return res.status(200).json(msg);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Mark a thread as read by admin
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true });
    if (!msg) return res.status(404).json({ message: "Thread not found" });
    
    // Notify admins list to update badges
    req.io.emit("thread_updated", msg);
    
    return res.status(200).json(msg);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  sendMessage,
  customerReply,
  getMyMessages,
  getAllMessages,
  replyToMessage,
  markAsRead,
  requestClose,
  confirmClose,
  declineClose,
};



