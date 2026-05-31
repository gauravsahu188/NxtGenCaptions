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
  limits: { fileSize: 1000 * 1024 * 1024 }, // 1GB limit
  fileFilter: (req, file, cb) => {
    // Be very permissive during dev to avoid 500 errors on valid videos with weird mimetypes
    cb(null, true);
  },
});
