import "dotenv/config";
import express from "express";
import cors from "cors";
import { recommendRouter } from "./routes/recommended.routes";

const app = express();

// CORS configuration - allow requests from the frontend
const corsOptions = {
  origin: process.env.ORIGIN_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the AI Movie Recommendation API!" });
});

app.use("/api/recommend", recommendRouter);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Backend is running on port, ${PORT}`);
});
