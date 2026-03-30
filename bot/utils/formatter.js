/**
 * Encabezado visual de categoría para el menú.
 * @param {string} nombreCategoria
 * @param {string} descripcion
 */
export function formatCategoryHeader(nombreCategoria, descripcion) {
  return (
    `» ˚୨•(=^●ω●^=)• ⊹ \`${nombreCategoria}\` ⊹\n` + `> ${descripcion}\n`
  );
}

/**
 * Lista un comando con alias y uso (sin duplicar el nombre en alias).
 * @param {object} cmd
 * @param {string} cmd.name
 * @param {string[]} [cmd.aliases]
 * @param {string} cmd.usage
 * @param {string} prefix
 */
export function formatCommandLine(cmd, prefix) {
  const p = String(prefix);
  const name = String(cmd.name);
  const aliases = (cmd.aliases ?? [])
    .map((a) => String(a).toLowerCase())
    .filter((a) => a && a !== name.toLowerCase());
  const parts = [p + name, ...aliases.map((a) => p + a)];
  const usageRest = extractUsageTail(cmd.usage, p, name);
  const tail = usageRest ? ` ${usageRest}` : '';
  return `✧ ${parts.join(' ')}${tail}`;
}

/**
 * @param {string} usage
 * @param {string} prefix
 * @param {string} name
 */
function extractUsageTail(usage, prefix, name) {
  const u = String(usage ?? '').trim();
  if (!u) return '';
  const withoutPrefix = u.startsWith(prefix) ? u.slice(prefix.length) : u;
  const first = withoutPrefix.split(/\s+/)[0]?.toLowerCase() ?? '';
  if (first === name.toLowerCase()) {
    return withoutPrefix.split(/\s+/).slice(1).join(' ').trim();
  }
  return withoutPrefix;
}

/**
 * @param {string} message
 */
export function formatError(message) {
  return `✖ ${message}`;
}

/**
 * @param {string} message
 */
export function formatSuccess(message) {
  return `✓ ${message}`;
}

/**
 * @param {object} info
 * @param {string} [info.jid]
 * @param {string} [info.name]
 * @param {string} [info.role]
 */
export function formatUserInfo(info) {
  const lines = [];
  if (info.name) lines.push(`Nombre: ${info.name}`);
  if (info.jid) lines.push(`JID: ${info.jid}`);
  if (info.role) lines.push(`Rol: ${info.role}`);
  return lines.join('\n');
}

/**
 * Sustituye `{clave}` por valores del objeto (bienvenida, claims, etc.).
 * @param {string} template
 * @param {Record<string, string>} vars
 */
export function applyTemplate(template, vars) {
  let s = String(template);
  for (const [k, v] of Object.entries(vars)) {
    if (v != null) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}
