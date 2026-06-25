"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load shared env from root - trigger reload 2
const envPath = path_1.default.join(__dirname, "../../.env.local");
let envResult = dotenv_1.default.config({ path: envPath, override: true });
if (envResult.error) {
    console.log(`[Server] Could not load ${envPath}, falling back to local .env`);
    envResult = dotenv_1.default.config(); // Loads .env from current directory
}
console.log("[Server] Loaded env from", envResult.error ? "none" : (envResult.parsed ? "success" : "unknown"));
console.log("[Server] Dotenv parsed keys:", envResult.parsed ? Object.keys(envResult.parsed) : envResult.error);
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const video_routes_1 = __importDefault(require("./routes/video.routes"));
const render_routes_1 = __importDefault(require("./routes/render.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const errors_1 = require("./utils/errors");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false })); // Allow cross-origin static files
app.use((0, cors_1.default)({ origin: "*" })); // Adjust in production
// Body parsing
app.use(express_1.default.json({
    limit: "50mb",
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
// Serve static files for video preview
const uploadDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express_1.default.static(uploadDir));
// Routes
app.use("/api/video", video_routes_1.default);
app.use("/api/render", render_routes_1.default);
app.use("/api/payment", payment_routes_1.default);
app.use("/api/webhooks", webhook_routes_1.default);
// Root endpoint to prevent "Cannot GET /"
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "Auto Captions Generator Backend running",
        healthCheck: "/api/health"
    });
});
// Health check endpoint
app.get("/api/health", (req, res) => {
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({ status: "error", message: err.message });
    }
    res.status(500).json({ status: "error", message: err.message, stack: err.stack });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
