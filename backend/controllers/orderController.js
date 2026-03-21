const OrderModel = require("../models/Order");
const OrderChat = require("../models/OrderChat");

const createOrder = async (req, res) => {
  try {
    const { items, totalAmount, address, phone, paymentMethod, paymentStatus, paymentId } = req.body;
    const userId = req.userId;

    const newOrder = new OrderModel({
      user: userId,
      items,
      totalAmount,
      address,
      phone,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentStatus || "Pending",
      paymentId: paymentId || "",
    });


    const savedOrder = await newOrder.save();

    // Notify admin or log (we can implement real-time admin alert later)
    req.io.emit("new_order", savedOrder);

    return res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await OrderModel.find({ user: userId })
      .populate("deliveryPartner", "name email vehicleId")
      .sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get User Orders Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("user", "name email")
      .populate("deliveryPartner", "name email vehicleId")
      .sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Notify the user in real-time
    req.io.to(`order_${orderId}`).emit("order_status_update", order);

    return res.status(200).json(order);
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderModel.findById(orderId)
      .populate("user", "name email")
      .populate("deliveryPartner", "name email vehicleId");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json(order);
  } catch (error) {
    console.error("Get Order Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAvailableOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find({
      status: "Ready to Deliver",
      deliveryPartner: null,
    }).populate("user", "name email");
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get Available Orders Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const pickupOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const deliveryPartnerId = req.userId;

    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { deliveryPartner: deliveryPartnerId, status: "Out for Delivery" },
      { new: true }
    ).populate("user", "name email").populate("deliveryPartner", "name email vehicleId");


    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Create a private chat session between customer and delivery partner
    await OrderChat.create({
      orderId: order._id,
      customerId: order.user,
      deliveryPartnerId: deliveryPartnerId,
    });

    // Notify via socket
    req.io.to(`order_${orderId}`).emit("order_status_update", order);
    req.io.emit("status_update", order);
    // Tell both sides a chat is now open
    req.io.to(`order_${orderId}`).emit("chat_started", { orderId: order._id });

    return res.status(200).json(order);
  } catch (error) {
    console.error("Pickup Order Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPartnerOrders = async (req, res) => {
  try {
    const deliveryPartnerId = req.userId;
    const orders = await OrderModel.find({ deliveryPartner: deliveryPartnerId })
      .sort({ createdAt: -1 })
      .populate("user", "name email");
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get Partner Orders Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const completeDelivery = async (req, res) => {
  try {
    const orderId = req.body.orderId || req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await OrderModel.findById(orderId).populate("deliveryPartner", "name email vehicleId");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = "Awaiting Delivery Confirmation";
    // We don't mark as Paid yet, wait for final confirmation
    await order.save();

    // Notify via socket
    const sOrderId = order._id.toString();
    req.io.to(`order_${sOrderId}`).emit("order_status_update", order);
    req.io.emit("status_update", order);
    
    // Trigger closure request in chat
    const chat = await OrderChat.findOne({ orderId: order._id });
    if (chat) {
      chat.closeRequestedBy = "delivery";
      await chat.save();
      req.io.to(`order_${sOrderId}`).emit("chat_close_request", { orderId: sOrderId, role: "delivery" });
    }


    return res.status(200).json(order);
  } catch (error) {
    console.error("Complete Delivery Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const requestCancellation = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    
    // Fetch user to properly identify role since req.userRole is not in standard auth payload
    const UserModel = require("../models/User");
    const requestingUser = await UserModel.findById(req.userId);
    const requestedBy = requestingUser ? requestingUser.role : "delivery"; 
    
    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { cancellationRequest: { requestedBy, reason, isProcessed: false } },
      { new: true }
    ).populate("user", "name email").populate("deliveryPartner", "name email vehicleId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    req.io.to(`order_${orderId}`).emit("order_status_update", order);
    req.io.emit("status_update", order);
    
    return res.status(200).json(order);
  } catch (error) {
    console.error("Request Cancellation Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
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
};



