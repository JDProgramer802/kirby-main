import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllCommands } from '../core/loader.js';
import {
  formatCategoryHeader,
  formatCommandLine,
} from './formatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

/**
 * @param {import('../types/command.js').CommandModule[]} [commands]
 * @param {object} options
 * @param {string} options.prefix
 * @param {Record<string, string>} options.categoryDescriptions
 * @param {string[]} options.categoryOrder
 * @param {boolean} options.nsfwEnabled
 * @param {string} [options.botName]
 */
export function buildMenuText(commands, options) {
  const {
    prefix,
    categoryDescriptions,
    categoryOrder,
    nsfwEnabled,
  } = options;

  const list = commands == null ? getAllCommands() : commands;
  const byCat = new Map();

  for (const cmd of list) {
    if (cmd.nsfw && !nsfwEnabled) continue;
    const cat = cmd.category ?? 'Sin categoría';
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(cmd);
  }

  const orderedCats = [];
  for (const c of categoryOrder) {
    if (byCat.has(c)) orderedCats.push(c);
  }
  for (const c of byCat.keys()) {
    if (!orderedCats.includes(c)) orderedCats.push(c);
  }

  const header = `${options.botName ?? 'Bot'}\n${options.prefix ?? '/'} — Menú de comandos\n`;
  let out = header + '\n';

  for (const cat of orderedCats) {
    const cmds = byCat.get(cat);
    if (!cmds?.length) continue;
    const desc = categoryDescriptions[cat] ?? 'Comandos generales.';
    out += formatCategoryHeader(cat, desc) + '\n';
    for (const cmd of cmds) {
      out += `${formatCommandLine(cmd, prefix)}\n`;
      out += `> ${cmd.description ?? ''}.\n\n`;
    }
  }

  return out.trimEnd();
}

/**
 * @param {object} config
 * @param {object} groupSettings
 * @param {string | null} [globalMenuBannerUrl] banner global de la instancia (sub-bot)
 */
export async function resolveBannerBuffer(config, groupSettings, globalMenuBannerUrl = null) {
  const url = groupSettings?.banner_url || globalMenuBannerUrl || null;
  if (url && /^https?:\/\//i.test(String(url))) {
    const res = await fetch(String(url));
    if (!res.ok) throw new Error('No se pudo descargar el banner (URL).');
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }
  if (url && String(url).length && !/^https?:\/\//i.test(String(url))) {
    const rel = String(url).replace(/^\.\//, '');
    const resolved = path.isAbsolute(rel) ? rel : path.resolve(rootDir, rel);
    return fs.readFile(resolved);
  }
  const localPath = config.defaultBannerPath;
  const resolved = path.isAbsolute(localPath) ? localPath : path.resolve(rootDir, localPath);
  return fs.readFile(resolved);
}

/**
 * Envía el menú como imagen con caption.
 * @param {import('@itsukichan/baileys').WASocket} sock
 * @param {string} jid
 * @param {object} config
 * @param {object} groupSettings
 */
/**
 * @param {string | null} [globalMenuBannerUrl]
 */
export async function sendMenuWithBanner(sock, jid, config, groupSettings, globalMenuBannerUrl = null) {
  const text = buildMenuText(getAllCommands(), {
    prefix: config.prefix,
    categoryDescriptions: config.categoryDescriptions,
    categoryOrder: config.categoryOrder,
    nsfwEnabled: Boolean(groupSettings?.nsfw_enabled ?? false),
    botName: config.name,
  });
  const buffer = await resolveBannerBuffer(config, groupSettings, globalMenuBannerUrl);
  await sock.sendMessage(jid, { image: buffer, caption: text });
}

/**
 * Envía imagen + caption usando el mismo banner que el menú (bienvenida/despedida).
 * @param {string[]} [mentions]
 */
export async function sendBannerMessage(sock, jid, caption, config, groupSettings, mentions = []) {
  const buffer = await resolveBannerBuffer(config, groupSettings);
  await sock.sendMessage(jid, {
    image: buffer,
    caption,
    mentions: mentions.length ? mentions : undefined,
  });
}
