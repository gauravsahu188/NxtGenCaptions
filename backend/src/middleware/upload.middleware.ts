import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 4000 * 1024 * 1024 }, // 4GB limit to support 4K video uploads
  fileFilter: (req, file, cb) => {
    // Reject image files if uploaded instead of video
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      return cb(new Error("IMAGE_UPLOAD_VIOLATION: Image files are not supported. Please upload a video file."));
    }
    const ext = path.extname(file.originalname || "").toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".heic"].includes(ext)) {
      return cb(new Error("IMAGE_UPLOAD_VIOLATION: Image files are not supported. Please upload a video file."));
    }
    // Allow video files
    cb(null, true);
  },
});
