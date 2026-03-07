import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import workRoutes from "./routes/workRoutes.js";
import chapterRoutes from "./routes/chapterRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import readerRoutes from "./routes/readerRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";

import db from "./config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);


// =======================
// HEALTHCHECK
// =======================

app.get("/", (req, res) => {
  res.status(200).send("API Running");
});

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch (err) {
    console.error("Healthcheck DB error:", err.message);
    res.status(200).json({
      status: "ok",
      database: "disconnected"
    });
  }
});


// =======================
// SECURITY
// =======================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
  })
);

const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGINS || "http://localhost:5173"
).split(",");

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true
  })
);


// =======================
// RATE LIMIT
// =======================

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20
});

app.use("/api/", apiLimiter);


// =======================
// BODY PARSER
// =======================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


// =======================
// UPLOADS
// =======================

const uploadDir = path.join("/tmp", "uploads");

const subDirs = [
  "covers",
  "chapters",
  "banners",
  "avatars"
];

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

subDirs.forEach(dir => {
  const dirPath = path.join(uploadDir, dir);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

app.use("/uploads", express.static(uploadDir));


// =======================
// SOCKET.IO
// =======================

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// =======================
// ROUTES
// =======================

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/works", workRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reader", readerRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/gamification", gamificationRoutes);


// =======================
// SERVE FRONTEND (PROD)
// =======================

if (process.env.NODE_ENV === "production") {

  const clientDist = path.join(
    __dirname,
    "..",
    "..",
    "client",
    "dist"
  );

  if (fs.existsSync(clientDist)) {

    console.log("📦 Serving frontend from:", clientDist);

    app.use(express.static(clientDist));

    app.get("/*", (req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });

  } else {
    console.log("⚠️ Frontend dist not found");
  }

}


// =======================
// 404 HANDLER
// =======================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});


// =======================
// ERROR HANDLER
// =======================

app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Error:", err);

  res.status(500).json({
    error: "Internal server error"
  });
});


// =======================
// START SERVER
// =======================

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


// =======================
// FAILSAFE (ANTI-CRASH)
// =======================

process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});