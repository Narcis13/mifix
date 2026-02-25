module.exports = {
  apps: [
    {
      name: "mifix-api",
      script: "./packages/server/dist/index.js",
      interpreter: "bun",
      cwd: "/opt/mifix",
      env: {
        NODE_ENV: "production",
        PORT: "3009",
      },
      env_file: "./packages/server/.env",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/mifix-error.log",
      out_file: "./logs/mifix-out.log",
      merge_logs: true,
    },
  ],
};
