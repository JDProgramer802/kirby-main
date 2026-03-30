import { useMultiFileAuthState } from '@itsukichan/baileys';
import fs from 'fs/promises';
import path from 'path';

/**
 * @param {string} sessionDir
 */
export async function loadAuthState(sessionDir) {
  await fs.mkdir(sessionDir, { recursive: true });
  return useMultiFileAuthState(path.resolve(sessionDir));
}

/**
 * Ruta absoluta de la carpeta de sesión.
 * @param {string} sessionDir
 */
export function resolveSessionDir(sessionDir) {
  return path.resolve(sessionDir);
}
