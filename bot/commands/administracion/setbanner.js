import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@itsukichan/baileys';
import { formatSuccess, formatError } from '../../utils/formatter.js';
import * as github from '../../utils/github.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..', '..');

function safeName(jid) {
  return String(jid).replace(/[^\w@.-]+/g, '_');
}

export default {
  name: 'setbanner',
  aliases: [],
  description: 'Establece el banner del grupo (URL, o responde/envía una imagen)',
  category: 'Administración',
  usage: '/setbanner <url> o imagen',
  cooldown: 5,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;

    const urlArg = args[0]?.trim();
    if (urlArg && /^https?:\/\//i.test(urlArg)) {
      await db.query(
        `INSERT INTO group_settings (jid, banner_url) VALUES (?, ?)
         ON CONFLICT (jid) DO UPDATE SET banner_url = EXCLUDED.banner_url`,
        [remote, urlArg]
      );
      await sock.sendMessage(remote, { text: formatSuccess('Banner (URL) actualizado.') });
      return;
    }

    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const img = msg.message?.imageMessage || q?.imageMessage;
    if (!img) {
      await sock.sendMessage(remote, {
        text: formatError('Envía una imagen con /setbanner, responde a una imagen, o usa /setbanner <url>.'),
      });
      return;
    }

    const mediaMsg =
      msg.message?.imageMessage != null
        ? msg
        : { ...msg, message: { imageMessage: q?.imageMessage } };

    const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
      reuploadRequest: sock.updateMediaMessage,
    });

    if (!buffer || !(buffer instanceof Buffer)) {
      await sock.sendMessage(remote, { text: formatError('No se pudo descargar la imagen.') });
      return;
    }

    let stored;
    try {
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
        const name = `${safeName(remote)}.png`;
        stored = await github.uploadFile(buffer, name, 'banners');
      } else {
        const dir = path.join(rootDir, 'assets', 'group-banners');
        await fs.mkdir(dir, { recursive: true });
        const rel = path.join('assets', 'group-banners', `${safeName(remote)}.png`);
        const full = path.join(rootDir, rel);
        await fs.writeFile(full, buffer);
        stored = rel.replace(/\\/g, '/');
      }
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Error al guardar el banner.'),
      });
      return;
    }

    await db.query(
      `INSERT INTO group_settings (jid, banner_url) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET banner_url = EXCLUDED.banner_url`,
      [remote, stored]
    );
    await sock.sendMessage(remote, { text: formatSuccess('Banner del grupo actualizado.') });
  },
};
