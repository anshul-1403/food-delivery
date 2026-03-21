const UserModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, cnf_password } = req.body;

    if (password !== cnf_password) {
      return res.status(400).json({ message: "The two passwords don't match" });
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      name,
      email,
      password: hashPassword,
    });

    const savedUser = await newUser.save();

    // Generate token
    const token = jwt.sign(
      { userId: savedUser._id },
      process.env.JWT_SECRET || "fallback_secret"
    );

    return res.status(201).json({
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        address: savedUser.address,
        phone: savedUser.phone,
      },
      token,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect login credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback_secret"
    );


    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { address, phone, name, profilePic, addresses } = req.body;
    const updated = await UserModel.findByIdAndUpdate(
      req.userId,
      { address, phone, name, profilePic, addresses },
      { new: true }
    ).select("-password");
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const registerDeliveryPartner = async (req, res) => {
  try {
    const { name, email, password, cnf_password, vehicleId, vehicleType, phone, address } = req.body;

    if (password !== cnf_password) {
      return res.status(400).json({ message: "The two passwords don't match" });
    }

    // Vehicle ID Regex (Indian Bike/Scooty: e.g. MH12AB1234)
    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!vehicleRegex.test(vehicleId?.toUpperCase())) {
      return res.status(400).json({ message: "Invalid Indian Vehicle Number (e.g., MH12AB1234)" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newPartner = new UserModel({
      name,
      email,
      password: hashPassword,
      role: "delivery",
      status: "pending",
      vehicleId: vehicleId.toUpperCase(),
      vehicleType,
      phone,
      address,
    });

    await newPartner.save();
    return res.status(201).json({ message: "Application submitted! Wait for admin approval." });
  } catch (error) {
    console.error("Delivery Reg Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllPartners = async (req, res) => {
  try {
    const partners = await UserModel.find({ role: "delivery" }).select("-password");
    return res.status(200).json(partners);
  } catch (error) { return res.status(500).json({ message: "Internal Server Error" }); }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("name email role");
    return res.status(200).json(users);
  } catch (error) { return res.status(500).json({ message: "Internal Server Error" }); }
};

const updatePartnerStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    const partner = await UserModel.findById(req.userId); // sender admin check ? 
    // Wait, the caller is admin by middleware.
    const target = await UserModel.findByIdAndUpdate(userId, { status }, { new: true });
    return res.status(200).json(target);
  } catch (error) { return res.status(500).json({ message: "Failed to update status" }); }
};

const requestVehicleUpdate = async (req, res) => {
  try {
    const { newId } = req.body;
    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!vehicleRegex.test(newId?.toUpperCase())) {
      return res.status(400).json({ message: "Invalid Indian Vehicle Number (e.g. MP04AB1234)" });
    }
    await UserModel.findByIdAndUpdate(req.userId, { pendingVehicleId: newId.toUpperCase() });
    return res.status(200).json({ message: "Update request sent to admin." });
  } catch (error) { return res.status(500).json({ message: "Error sending request" }); }
};

const handleVehicleApproval = async (req, res) => {
  try {
    const { userId, action, manualId } = req.body;
    const partner = await UserModel.findById(userId);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    if (action === "approve") {
      partner.vehicleId = partner.pendingVehicleId || partner.vehicleId;
      partner.pendingVehicleId = "";
    } else if (action === "reject") {
      partner.pendingVehicleId = "";
    } else if (action === "override") {
      const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
      if (!vehicleRegex.test(manualId?.toUpperCase())) return res.status(400).json({ message: "Invalid Vehicle Format" });
      partner.vehicleId = manualId.toUpperCase();
    }

    await partner.save();
    return res.status(200).json(partner);
  } catch (error) { return res.status(500).json({ message: "Failed to process update" }); }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  registerDeliveryPartner,
  getAllPartners,
  getAllUsers,
  updatePartnerStatus,
  requestVehicleUpdate,
  handleVehicleApproval,
};




