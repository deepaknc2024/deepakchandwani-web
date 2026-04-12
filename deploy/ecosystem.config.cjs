module.exports = {
  apps: [{
    name: 'dc-web-server',
    script: './server/dist/index.js',
    cwd: '/opt/deepakchandwani-web',
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/dc-web/error.log',
    out_file: '/var/log/dc-web/out.log',
    merge_logs: true,
  }],
};
