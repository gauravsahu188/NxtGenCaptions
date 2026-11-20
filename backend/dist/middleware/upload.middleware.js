"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: { fileSize: 4000 * 1024 * 1024 }, // 4GB limit to support 4K video uploads
    fileFilter: (req, file, cb) => {
        // Reject image files if uploaded instead of video
        if (file.mimetype && file.mimetype.startsWith("image/")) {
            return cb(new Error("IMAGE_UPLOAD_VIOLATION: Image files are not supported. Please upload a video file."));
        }
        const ext = path_1.default.extname(file.originalname || "").toLowerCase();
        if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".heic"].includes(ext)) {
            return cb(new Error("IMAGE_UPLOAD_VIOLATION: Image files are not supported. Please upload a video file."));
        }
        // Allow video files
        cb(null, true);
    },
});
