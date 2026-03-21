const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: [
      {
        dish: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "dishes",
          required: true,
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Placed", "Confirmed", "Cooking", "Ready to Deliver", "Out for Delivery", "Awaiting Delivery Confirmation", "Delivered", "Cancelled"],


      default: "Placed",
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Razorpay"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    paymentId: {
      type: String,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    cancellationRequest: {
      requestedBy: { type: String, enum: ["delivery", "customer", null], default: null },
      reason: { type: String },
      isProcessed: { type: Boolean, default: false }
    }
  },



  { timestamps: true }
);

const OrderModel = mongoose.model("order", orderSchema);

module.exports = OrderModel;
