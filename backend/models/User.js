const mongoose = require("mongoose");

const UserModel = mongoose.model("user", {
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }, // user, admin, delivery
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  profilePic: { type: String, default: "" },
  addresses: [{ type: String }],
  
  // Delivery Partner Specific
  vehicleId: { type: String },
  pendingVehicleId: { type: String, default: "" },
  status: { type: String, default: "approved" }, // pending, approved, rejected
});







module.exports = UserModel;
