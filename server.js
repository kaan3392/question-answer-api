const express = require("express");
const dotenv = require("dotenv");
const routers = require("./routers");
const connectDatabase = require("./helpers/database/connectDB");
const customErrorHandler = require("./middlewares/errors/customErrorHandler");
const path = require("path");

const app = express();

dotenv.config({
  path: "./config/env/config.env",
});

//MongoDB connection

connectDatabase();

//Express Body Middleware

app.use(express.json());

const PORT = process.env.PORT;

//Routers middlewares

app.use("/api", routers);

//Error handlers

app.use(customErrorHandler);

//Static Files

app.use(express.static(path.join(__dirname, "public")));

// Server Connection

app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
