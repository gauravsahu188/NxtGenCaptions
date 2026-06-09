import dotenv from "dotenv";
import path from "path";

// Load shared env from root - trigger reload 2
const envPath = path.join(__dirname, "../../.env.local");
let envResult = dotenv.config({ path: envPath, override: true });
if (envResult.error) {
  console.log(`[Server] Could not load ${envPath}, falling back to local .env`);
  envResult = dotenv.config(); // Loads .env from current directory
}
console.log("[Server] Loaded env from", envResult.error ? "none" : (envResult.parsed ? "success" : "unknown"));
console.log("[Server] Dotenv parsed keys:", envResult.parsed ? Object.keys(envResult.parsed) : envResult.error);
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";

import videoRoutes from "./routes/video.routes";
import renderRoutes from "./routes/render.routes";
import paymentRoutes from "./routes/payment.routes";
import webhookRoutes from "./routes/webhook.routes";
import { AppError } from "./utils/errors";

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow cross-origin static files
app.use(cors({ origin: "*" })); // Adjust in production

// Body parsing
app.use(
  express.json({
    limit: "50mb",
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files for video preview
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// Routes
app.use("/api/video", videoRoutes);
app.use("/api/render", renderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);

// Root endpoint to prevent "Cannot GET /"
app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Auto Captions Generator Backend running",
    healthCheck: "/api/health"
  });
});

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Auto Captions Generator Backend running",
    apiKeyLength: process.env.DEEPGRAM_API_KEY?.length || 0,
    hasApiKey: !!process.env.DEEPGRAM_API_KEY,
    apiKey: process.env.DEEPGRAM_API_KEY?.substring(0, 5) + "...",
    dbUrl: process.env.DATABASE_URL?.substring(0, 30) + "..."
  });
});

// Basic error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: "error", message: err.message });
  }

  res.status(500).json({ status: "error", message: err.message, stack: err.stack });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
