import { execSync } from 'node:child_process';

const command = `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'vite\\.js' } | ForEach-Object { $_.ProcessId }`;

try {
  const output = execSync(`powershell -NoProfile -Command "${command}"`, { encoding: 'utf8' });
  const pids = output
    .split(/\r?\n/)
    .map((line) => Number.parseInt(line.trim(), 10))
    .filter((id) => Number.isFinite(id));

  if (pids.length === 0) {
    process.exit(0);
  }

  const uniquePids = [...new Set(pids)];
  execSync(`taskkill /F /PID ${uniquePids.join(',')}`, { stdio: 'inherit' });
} catch {
  process.exit(0);
}
