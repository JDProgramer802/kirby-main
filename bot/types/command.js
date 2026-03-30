/**
 * @typedef {object} CommandModule
 * @property {string} name
 * @property {string[]} [aliases]
 * @property {string} description
 * @property {string} category
 * @property {string} usage
 * @property {number} [cooldown]
 * @property {boolean} [adminOnly]
 * @property {boolean} [ownerOnly]
 * @property {boolean} [groupOnly]
 * @property {boolean} [nsfw]
 * @property {(
 *   sock: import('@itsukichan/baileys').WASocket,
 *   msg: import('@itsukichan/baileys').proto.IWebMessageInfo,
 *   args: string[],
 *   db: {
 *     query: (sql: string, params?: unknown[]) => Promise<unknown>,
 *     getGroupSettings: (jid: string) => Promise<Record<string, unknown>>,
 *     groupSettings: Record<string, unknown> | null,
 *     instanceId?: string,
 *     invokedCommand?: string,
 *   },
 *   config: Record<string, unknown>
 * ) => Promise<void>} execute
 */

export {};
