import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsRoot = path.join(__dirname, '..', 'commands');

/** @typedef {import('../types/command.js').CommandModule} CommandModule */

/** @type {Map<string, CommandModule & { filePath: string }>} */
const byName = new Map();

/**
 * @returns {(CommandModule & { filePath: string })[]}
 */
export function getAllCommands() {
  const seen = new Set();
  const out = [];
  for (const cmd of byName.values()) {
    if (seen.has(cmd.filePath)) continue;
    seen.add(cmd.filePath);
    out.push(cmd);
  }
  return out;
}

/**
 * @param {string} nameOrAlias
 * @returns {(CommandModule & { filePath: string }) | undefined}
 */
export function getCommand(nameOrAlias) {
  const key = String(nameOrAlias).toLowerCase();
  return byName.get(key);
}

async function collectJsFiles(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await collectJsFiles(full, acc);
    else if (e.isFile() && e.name.endsWith('.js') && !e.name.startsWith('_')) acc.push(full);
  }
  return acc;
}

/**
 * Escanea commands/ y registra cada export default como comando.
 */
/** Recarga hot los comandos desde disco (mismo proceso). */
export async function reloadCommands() {
  return loadCommands();
}

export async function loadCommands() {
  byName.clear();
  let files = [];
  try {
    files = await collectJsFiles(commandsRoot);
  } catch {
    return byName;
  }

  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    const cmd = mod.default;
    if (!cmd || typeof cmd !== 'object' || typeof cmd.execute !== 'function') continue;

    const primary = String(cmd.name ?? path.basename(file, '.js')).toLowerCase();
    const entry = /** @type {CommandModule & { filePath: string }} */ ({
      ...cmd,
      filePath: file,
    });

    const keys = new Set([
      primary,
      ...(Array.isArray(cmd.aliases) ? cmd.aliases : []).map((a) => String(a).toLowerCase()),
    ]);

    for (const k of keys) {
      const existing = byName.get(k);
      if (existing) {
        if (existing.filePath === file) continue;
        console.warn(`[loader] Duplicado "${k}": se mantiene ${existing.filePath}, se ignora ${file}`);
        continue;
      }
      byName.set(k, entry);
    }
  }

  return byName;
}
