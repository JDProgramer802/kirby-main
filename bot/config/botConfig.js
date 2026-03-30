import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

/**
 * @param {Record<string, unknown>} [overrides]
 */
export function buildBotConfig(overrides = {}) {
  const prefix = overrides.prefix ?? process.env.BOT_PREFIX ?? '/';
  const ownerRaw = overrides.ownerNumbers ?? process.env.BOT_OWNER ?? '';
  const ownerNumbers = Array.isArray(ownerRaw)
    ? ownerRaw
    : String(ownerRaw)
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    id: overrides.id ?? 'main',
    name: overrides.name ?? process.env.BOT_NAME ?? 'WhatsApp Bot',
    prefix: String(prefix),
    ownerNumbers,
    defaultBannerPath: path.resolve(
      rootDir,
      overrides.defaultBannerPath ?? 'assets/default_banner.png'
    ),
    /** Descripciones de categoría para el menú (clave = category del comando) */
    categoryDescriptions: {
      Economía: 'Comandos de economía y moneda virtual.',
      Stickers: 'Creación y gestión de stickers.',
      Gacha: 'Sistema gacha y tiradas.',
      Descargas: 'Descarga de medios desde enlaces.',
      Perfiles: 'Perfiles de usuario y estadísticas.',
      Subbots: 'Gestión de sub-bots.',
      Utilidades: 'Herramientas y ayuda general.',
      Administración: 'Configuración del grupo y del bot.',
      NSFW: 'Contenido solo para grupos con NSFW activado.',
      ...overrides.categoryDescriptions,
    },
    /** Orden fijo de categorías en el menú */
    categoryOrder: [
      'Utilidades',
      'Administración',
      'Economía',
      'Stickers',
      'Gacha',
      'Descargas',
      'Perfiles',
      'Subbots',
      'NSFW',
      ...(overrides.extraCategoryOrder ?? []),
    ],
    ...overrides,
  };
}

export default buildBotConfig();
