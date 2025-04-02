const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dishes = require("./routes/dishRoutes");
const userRoutes = require("./routes/userRoutes");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://darkking:anshul@cluster0.bpjlo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.log(err);
  });
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hello World",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js"], // Files containing Swagger annotations
};

const openapiSpecification = swaggerJSDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(openapiSpecification));

// Middleware
app.use((req, res, next) => {
  console.log("Time:", Date.now());
  next();
});

app.get("/", (req, res) => {
  res.json("Hello");
});

app.use("/api", dishes);
app.use("/api/user", userRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});