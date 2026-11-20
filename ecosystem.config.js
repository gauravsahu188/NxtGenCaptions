const path = require("path");
const fs = require("fs");

// Check if backend compiled JS exists; if so, run fast native node dist/server.js, otherwise tsx
const hasBackendDist = fs.existsSync(path.join(__dirname, "backend", "dist", "server.js"));

module.exports = {
  apps: [
    {
      name: "nxtgen-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1, // 1 instance is ideal for t2/t3 EC2 instances
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 5000,
      listen_timeout: 10000,
      error_file: "../logs/pm2-frontend-error.log",
      out_file: "../logs/pm2-frontend-out.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "nxtgen-backend",
      cwd: "./backend",
      script: hasBackendDist ? "dist/server.js" : "src/server.ts",
      interpreter: hasBackendDist ? "node" : "npx",
      args: hasBackendDist ? "" : "tsx",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 5000,
      listen_timeout: 10000,
      error_file: "../logs/pm2-backend-error.log",
      out_file: "../logs/pm2-backend-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
