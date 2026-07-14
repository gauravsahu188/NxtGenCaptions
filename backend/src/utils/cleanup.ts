import fs from "fs";
import path from "path";

/**
 * Recursively cleans up a directory by deleting files older than maxAgeMs.
 * If subdirectories become empty, they are also deleted (except the root directory).
 */
export function cleanOldFiles(dirPath: string, maxAgeMs: number): void {
  if (!fs.existsSync(dirPath)) return;

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        cleanOldFiles(fullPath, maxAgeMs);
        
        // If directory is now empty, delete it
        const subFiles = fs.readdirSync(fullPath);
        if (subFiles.length === 0) {
          fs.rmdirSync(fullPath);
          console.log(`[Cleanup] Deleted empty directory: ${fullPath}`);
        }
      } else {
        const fileAgeMs = Date.now() - stat.mtimeMs;
        if (fileAgeMs > maxAgeMs) {
          fs.unlinkSync(fullPath);
          console.log(
            `[Cleanup] Deleted old file: ${fullPath} (Age: ${Math.round(
              fileAgeMs / 1000 / 60
            )} mins)`
          );
        }
      }
    }
  } catch (error) {
    console.error(`[Cleanup] Error cleaning up directory ${dirPath}:`, error);
  }
}

/**
 * Initializes a periodic cleanup task.
 * @param intervalMs How often the cleanup task runs (default 15 minutes)
 * @param maxAgeMs Max age of files before they are deleted (default 30 minutes)
 */
export function startPeriodicCleanup(
  intervalMs = 15 * 60 * 1000,
  maxAgeMs = 30 * 60 * 1000
): NodeJS.Timeout {
  const uploadsDir = path.join(process.cwd(), "uploads");
  const tempDir = path.join(process.cwd(), "temp");

  console.log(
    `[Cleanup] Starting periodic cleanup task every ${
      intervalMs / 1000 / 60
    } minutes...`
  );

  // Run initial cleanup synchronously on startup
  try {
    cleanOldFiles(uploadsDir, maxAgeMs);
    cleanOldFiles(tempDir, maxAgeMs);
  } catch (err) {
    console.error("[Cleanup] Initial cleanup on startup failed:", err);
  }

  return setInterval(() => {
    console.log("[Cleanup] Running periodic file cleanup...");
    cleanOldFiles(uploadsDir, maxAgeMs);
    cleanOldFiles(tempDir, maxAgeMs);
  }, intervalMs);
}
