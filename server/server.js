import dotenv from "dotenv";
dotenv.config();

import express from "express"
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser"; //with this, you can get cookie easily in backend, used as a middleware
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import initSocket from "./socket.js";

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.send("Chat API is running"));
app.use("/api/auth", authRoutes);
app.use("/api/chat", userRoutes);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log("Server running on port " + PORT));
  })
  .catch((err) => console.log("MongoDB error:", err.message));
