/** Registro en memoria de instancias activas (para /bots, /botinfo). */

/** @type {Map<string, { sock: import('@itsukichan/baileys').WASocket, startedAt: number, config: Record<string, unknown> }>} */
const instances = new Map();

/**
 * @param {string} id
 * @param {import('@itsukichan/baileys').WASocket} sock
 * @param {Record<string, unknown>} config
 */
export function registerInstance(id, sock, config) {
  instances.set(id, { sock, startedAt: Date.now(), config });
}

/**
 * @param {string} id
 */
export function unregisterInstance(id) {
  instances.delete(id);
}

export function listInstances() {
  return [...instances.entries()].map(([id, v]) => ({
    id,
    startedAt: v.startedAt,
    config: v.config,
    sock: v.sock,
  }));
}

/**
 * @param {string} id
 */
export function getInstance(id) {
  return instances.get(id);
}
