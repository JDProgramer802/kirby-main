import { applyTemplate, formatError } from '../../utils/formatter.js';
import { sendBannerMessage } from '../../utils/menu.js';

function userDisplay(jid) {
  return String(jid).split('@')[0] ?? '';
}

export default {
  name: 'testwelcome',
  aliases: ['testgoodbye'],
  description: 'Prueba el mensaje de bienvenida o despedida con el banner',
  category: 'Utilidades',
  usage: '/testwelcome',
  cooldown: 10,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, config) {
    const remote = msg.key.remoteJid;
    const participant = msg.key.participant ?? remote;
    if (!remote?.endsWith('@g.us') || !participant) return;

    const gs = await db.getGroupSettings(remote);
    const meta = await sock.groupMetadata(remote).catch(() => null);
    const groupName = meta?.subject ?? 'Grupo';
    const num = userDisplay(participant);

    const isGoodbye = db.invokedCommand === 'testgoodbye';

    const template = isGoodbye
      ? gs.goodbye_message || 'Adiós {tag}, nos vemos.'
      : gs.welcome_message || 'Hola {tag}, bienvenido/a a {group}.';

    const caption = applyTemplate(template, {
      user: num,
      group: groupName,
      tag: `@${num}`,
    });

    try {
      await sendBannerMessage(
        sock,
        remote,
        caption,
        config,
        gs,
        isGoodbye ? [] : [participant]
      );
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Error al enviar prueba.'),
      });
    }
  },
};
