require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const dishes = require("./routes/dishRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST", "PATCH"],
  },
});

const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Food Delivery API",
      version: "1.0.0",
      description: "API for a real-time food delivery application",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const openapiSpecification = swaggerJSDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(openapiSpecification));

// Socket.io connection
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join_order", (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`👤 User joined room: order_${orderId}`);
  });

  socket.on("join_chat", (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`💬 User joined chat room for order: ${orderId}`);
  });

  socket.on("join_message", (messageId) => {
    socket.join(`message_${messageId}`);
    console.log(`📬 User joined message thread room: ${messageId}`);
  });


  socket.on("disconnect", () => {
    console.log("🔌 User disconnected");
  });
});

// Attach io to req for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Food Delivery API", docs: "/api-docs" });
});

const orderChatRoutes = require("./routes/orderChatRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use("/api", dishes);
app.use("/api/user", userRoutes);
app.use("/api", orderRoutes);
app.use("/api", messageRoutes);
app.use("/api", orderChatRoutes);



server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});