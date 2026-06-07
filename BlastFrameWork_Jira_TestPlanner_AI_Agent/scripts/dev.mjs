import { spawn } from 'node:child_process';

const processes = [
  spawn('node', ['server/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, API_PORT: process.env.API_PORT || '5174' }
  }),
  spawn('vite', ['--host', '0.0.0.0'], {
    stdio: 'inherit',
    env: { ...process.env, API_PORT: process.env.API_PORT || '5174' },
    shell: process.platform === 'win32'
  })
];

const stopAll = () => {
  for (const child of processes) {
    if (!child.killed) child.kill('SIGTERM');
  }
};

process.on('SIGINT', () => {
  stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(0);
});

for (const child of processes) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });
}
