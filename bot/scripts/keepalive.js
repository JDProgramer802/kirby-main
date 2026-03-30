/**
 * Supervisa el proceso del bot y lo relanza si termina o falla.
 * Uso en CI o servidor: node scripts/keepalive.js
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const entry = path.join(rootDir, 'index.js');

function start() {
  const child = spawn(process.execPath, [entry], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    console.error(
      `[keepalive] Proceso terminó (code=${code}, signal=${signal ?? 'none'}). Reiniciando en 5s...`
    );
    setTimeout(start, 5000);
  });
}

start();
