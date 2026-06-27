import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { recommendRouter } from "./routes/recommended.routes";
import { requireAuth } from "./middleware/auth.middleware";

const app = express();

const corsOptions = {
  origin: process.env.ORIGIN_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the AI Movie Recommendation API!" });
});

app.use("/api/auth", authRouter);
app.use("/api/recommend", requireAuth, recommendRouter);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Backend is running on port, ${PORT}`);
});
