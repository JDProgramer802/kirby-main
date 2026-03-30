import { getCommand } from './loader.js';
import {
  getPermissionLevel,
  canRunCommand,
  PermissionLevel,
} from '../utils/permissions.js';
import { formatError, applyTemplate } from '../utils/formatter.js';
import { query } from '../database/db.js';
import { sendBannerMessage } from '../utils/menu.js';
import {
  shouldDeleteAntilink,
  bumpProfileActivity,
  bumpCommandCount,
} from '../utils/groupPassive.js';

/** @typedef {ReturnType<import('../config/botConfig.js').buildBotConfig>} BotConfigInstance */

/**
 * @param {import('@itsukichan/baileys').proto.IWebMessageInfo | null | undefined} m
 */
export function extractMessageText(m) {
  if (!m?.message) return '';
  const msg = m.message;
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    ''
  );
}

/**
 * @param {string} jid
 */
function isGroupJid(jid) {
  return Boolean(jid && jid.endsWith('@g.us'));
}

/**
 * @param {string} groupJid
 */
export async function getGroupSettings(groupJid) {
  const rows = await query('SELECT * FROM group_settings WHERE jid = ? LIMIT 1', [groupJid]);
  const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
  if (row) return row;
  return {
    jid: groupJid,
    welcome_message: null,
    goodbye_message: null,
    welcome_enabled: true,
    goodbye_enabled: true,
    nsfw_enabled: false,
    banner_url: null,
    economy_enabled: false,
    gacha_enabled: false,
    bot_enabled: true,
    antilink_enabled: false,
    admin_alerts_enabled: false,
    only_admin_commands: false,
    warn_limit: 3,
    economy_currency: 'coins',
    primary_bot_jid: null,
    invite_link_cache: null,
  };
}

/**
 * @param {object} ctx
 * @param {string} userJid
 * @param {string} cmdKey
 */
function checkCooldown(ctx, userJid, cmdKey, cooldownSec) {
  const key = `${userJid}:${cmdKey}`;
  const now = Date.now();
  const until = ctx.cooldowns.get(key);
  if (until && until > now) return Math.ceil((until - now) / 1000);
  ctx.cooldowns.set(key, now + cooldownSec * 1000);
  return 0;
}

/**
 * @param {import('@itsukichan/baileys').WASocket} sock
 * @param {import('@itsukichan/baileys').BaileysEventMap['messages.upsert']} upsert
 * @param {object} ctx
 * @param {BotConfigInstance} ctx.config
 * @param {Map<string, number>} ctx.cooldowns
 */
export async function handleMessagesUpsert(sock, upsert, ctx) {
  const { messages, type } = upsert;
  if (type !== 'notify') return;

  for (const msg of messages) {
    try {
    if (!msg.message || msg.key.fromMe) continue;

    const remote = msg.key.remoteJid;
    if (!remote) continue;

    const textFull = extractMessageText(msg).trim();
    const prefix = ctx.config.prefix;
    const participant = msg.key.participant ?? remote;

    if (participant?.endsWith('@bot')) continue;

    let groupSettings = null;

    if (isGroupJid(remote)) {
      groupSettings = await getGroupSettings(remote);

      if (groupSettings.bot_enabled !== false) {
        if (shouldDeleteAntilink(groupSettings, textFull)) {
          try {
            await sock.sendMessage(remote, { delete: msg.key });
          } catch {
            /* sin permisos */
          }
          continue;
        }

        if (participant?.endsWith('@s.whatsapp.net')) {
          try {
            await bumpProfileActivity(remote, participant);
          } catch (e) {
            console.error('[bumpProfileActivity]', e);
          }
        }
      }

      if (!textFull.startsWith(prefix)) continue;

      if (groupSettings.bot_enabled === false) continue;
    } else {
      if (!textFull.startsWith(prefix)) continue;
    }

    const body = textFull.slice(prefix.length).trim();
    if (!body) continue;

    const [rawCmd, ...args] = body.split(/\s+/);
    const cmdName = rawCmd.toLowerCase();
    const cmd = getCommand(cmdName);
    if (!cmd) continue;

    if (cmd.groupOnly && !isGroupJid(remote)) {
      await sock.sendMessage(remote, { text: formatError('Este comando solo funciona en grupos.') });
      continue;
    }

    if (isGroupJid(remote) && groupSettings) {
      if ((cmd.nsfw || cmd.category === 'NSFW') && !groupSettings.nsfw_enabled) {
        await sock.sendMessage(remote, { text: formatError('NSFW desactivado en este grupo.') });
        continue;
      }
      if (cmd.category === 'Economía' && !groupSettings.economy_enabled) {
        await sock.sendMessage(remote, {
          text: formatError('La economía está desactivada. Un admin puede usar /toggleconomy on'),
        });
        continue;
      }
      if (cmd.category === 'Gacha' && !groupSettings.gacha_enabled) {
        await sock.sendMessage(remote, {
          text: formatError('El gacha está desactivado. Un admin puede usar /togglegacha on'),
        });
        continue;
      }

      if (groupSettings.only_admin_commands) {
        const lvlEarly = await getPermissionLevel(sock, msg, ctx.config);
        if (lvlEarly === PermissionLevel.MEMBER) {
          await sock.sendMessage(remote, {
            text: formatError('Solo administradores pueden usar comandos del bot en este grupo.'),
          });
          continue;
        }
      }
    }

    const level = await getPermissionLevel(sock, msg, ctx.config);
    if (!canRunCommand(level, cmd)) {
      await sock.sendMessage(remote, { text: formatError('No tienes permiso para usar este comando.') });
      continue;
    }

    const cd = cmd.cooldown ?? 5;
    let wait = 0;
    if (cmd.category !== 'Economía') {
      wait = checkCooldown(ctx, participant, cmd.name, cd);
    }
    if (wait > 0) {
      await sock.sendMessage(remote, { text: formatError(`Espera ${wait}s antes de reutilizar este comando.`) });
      continue;
    }

    try {
      await cmd.execute(
        sock,
        msg,
        args,
        {
          query,
          getGroupSettings,
          groupSettings: isGroupJid(remote) ? groupSettings : null,
          instanceId: ctx.instanceId,
          invokedCommand: cmdName,
          sessionDir: ctx.sessionDir,
          config: ctx.config,
        },
        ctx.config
      );
      if (isGroupJid(remote) && participant?.endsWith('@s.whatsapp.net')) {
        await bumpCommandCount(remote, participant).catch(() => {});
      }
    } catch (e) {
      console.error('[handler]', e);
      try {
        await sock.sendMessage(remote, {
          text: formatError(e instanceof Error ? e.message : 'Error al ejecutar el comando.'),
        });
      } catch {
        /* ignore */
      }
    }
    } catch (e) {
      console.error('[handler-msg]', e);
    }
  }
}

/**
 * @param {string} jid
 */
function userDisplay(jid) {
  const n = String(jid).split('@')[0] ?? '';
  return n;
}

/**
 * @param {import('@itsukichan/baileys').WASocket} sock
 * @param {import('@itsukichan/baileys').BaileysEventMap['group-participants.update']} update
 * @param {{ config: BotConfigInstance, instanceId?: string }} ctx
 */
export async function handleGroupParticipantsUpdate(sock, update, ctx) {
  const id = update.id;
  const participants = update.participants ?? [];
  const action = update.action;
  if (!id || !id.endsWith('@g.us')) return;

  const settings = await getGroupSettings(id);
  const meta = await sock.groupMetadata(id).catch(() => null);
  const groupName = meta?.subject ?? 'Grupo';

  const welcomeOn = Boolean(settings.welcome_enabled ?? true);
  const goodbyeOn = Boolean(settings.goodbye_enabled ?? true);

  if (action === 'add' && welcomeOn) {
    for (const p of participants) {
      const num = userDisplay(p);
      const template =
        settings.welcome_message ||
        'Hola {tag}, bienvenido/a a {group}.';
      const caption = applyTemplate(template, {
        user: num,
        group: groupName,
        tag: `@${num}`,
      });
      await sendBannerMessage(sock, id, caption, ctx.config, settings, [p]);
    }
  }

  if (action === 'remove' && goodbyeOn) {
    for (const p of participants) {
      const num = userDisplay(p);
      const template =
        settings.goodbye_message ||
        'Adiós {tag}, nos vemos.';
      const caption = applyTemplate(template, {
        user: num,
        group: groupName,
        tag: `@${num}`,
      });
      await sendBannerMessage(sock, id, caption, ctx.config, settings, []);
    }
  }

  if (settings.admin_alerts_enabled && (action === 'promote' || action === 'demote')) {
    const verb = action === 'promote' ? '⬆️ *Promovido a admin*' : '⬇️ *Degradado*';
    for (const p of participants) {
      const num = userDisplay(p);
      try {
        await sock.sendMessage(id, {
          text: `${verb}: @${num}`,
          mentions: [p],
        });
      } catch {
        /* ignore */
      }
    }
  }
}
