const path = require("path");
const fs = require("fs");

// Check if backend compiled JS exists; if so, run fast native node dist/server.js, otherwise tsx
const hasBackendDist = fs.existsSync(path.join(__dirname, "backend", "dist", "server.js"));

module.exports = {
  apps: [
    {
      name: "nxtgen-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1, // Set to 'max' for multi-core cluster mode or 1/2 for t2/t3 EC2 instances
      exec_mode: "cluster",
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
      script: hasBackendDist ? "node" : "npx",
      args: hasBackendDist ? "dist/server.js" : "tsx src/server.ts",
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
