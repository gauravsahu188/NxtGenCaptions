"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanOldFiles = cleanOldFiles;
exports.startPeriodicCleanup = startPeriodicCleanup;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Recursively cleans up a directory by deleting files older than maxAgeMs.
 * If subdirectories become empty, they are also deleted (except the root directory).
 */
function cleanOldFiles(dirPath, maxAgeMs) {
    if (!fs_1.default.existsSync(dirPath))
        return;
    try {
        const files = fs_1.default.readdirSync(dirPath);
        for (const file of files) {
            const fullPath = path_1.default.join(dirPath, file);
            const stat = fs_1.default.statSync(fullPath);
            if (stat.isDirectory()) {
                cleanOldFiles(fullPath, maxAgeMs);
                // If directory is now empty, delete it
                const subFiles = fs_1.default.readdirSync(fullPath);
                if (subFiles.length === 0) {
                    fs_1.default.rmdirSync(fullPath);
                    console.log(`[Cleanup] Deleted empty directory: ${fullPath}`);
                }
            }
            else {
                const fileAgeMs = Date.now() - stat.mtimeMs;
                if (fileAgeMs > maxAgeMs) {
                    fs_1.default.unlinkSync(fullPath);
                    console.log(`[Cleanup] Deleted old file: ${fullPath} (Age: ${Math.round(fileAgeMs / 1000 / 60)} mins)`);
                }
            }
        }
    }
    catch (error) {
        console.error(`[Cleanup] Error cleaning up directory ${dirPath}:`, error);
    }
}
/**
 * Initializes a periodic cleanup task.
 * @param intervalMs How often the cleanup task runs (default 15 minutes)
 * @param maxAgeMs Max age of files before they are deleted (default 30 minutes)
 */
function startPeriodicCleanup(intervalMs = 15 * 60 * 1000, maxAgeMs = 30 * 60 * 1000) {
    const uploadsDir = path_1.default.join(process.cwd(), "uploads");
    const tempDir = path_1.default.join(process.cwd(), "temp");
    console.log(`[Cleanup] Starting periodic cleanup task every ${intervalMs / 1000 / 60} minutes...`);
    // Run initial cleanup synchronously on startup
    try {
        cleanOldFiles(uploadsDir, maxAgeMs);
        cleanOldFiles(tempDir, maxAgeMs);
    }
    catch (err) {
        console.error("[Cleanup] Initial cleanup on startup failed:", err);
    }
    return setInterval(() => {
        console.log("[Cleanup] Running periodic file cleanup...");
        cleanOldFiles(uploadsDir, maxAgeMs);
        cleanOldFiles(tempDir, maxAgeMs);
    }, intervalMs);
}
