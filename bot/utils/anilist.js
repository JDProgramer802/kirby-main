/**
 * Cliente para la API GraphQL pública de AniList (sin API key).
 * @see https://anilist.gitbook.io/anilist-apiv2-docs/
 * @see https://graphql.anilist.co
 */

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

/**
 * @param {string} query
 * @param {Record<string, unknown>} [variables]
 */
async function gql(query, variables = {}) {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

const CHARACTER_FIELDS = `
  id
  name { full native }
  image { large medium }
  favourites
  description (asHtml: false)
  media(sort: POPULARITY_DESC, page: 1, perPage: 5) {
    nodes {
      type
      title { romaji english native }
    }
  }
`;

/**
 * @param {unknown} fav
 */
export function rarityFromFavourites(fav) {
  const f = Number(fav) || 0;
  if (f >= 50_000) return 'legendario';
  if (f >= 10_000) return 'epico';
  if (f >= 2000) return 'raro';
  return 'comun';
}

/**
 * @param {number} base
 * @param {string} rarity
 */
export function baseValueFromStats(base, rarity) {
  const mult = { comun: 1, raro: 1.5, epico: 2.2, legendario: 3 }[rarity] ?? 1;
  return Math.min(50_000, Math.max(50, Math.floor(base * mult)));
}

/**
 * Normaliza respuesta Character de AniList para el bot.
 * @param {Record<string, unknown>} raw
 */
export function normalizeCharacter(raw) {
  if (!raw?.id) return null;
  const mediaNodes = /** @type {any[]} */ (raw.media?.nodes ?? []);
  const first = mediaNodes[0];
  const title = first?.title ?? {};
  const series =
    title.romaji || title.english || title.native || 'Sin serie listada';
  const name = /** @type {any} */ (raw.name)?.full || '???';
  const imageUrl =
    /** @type {any} */ (raw.image)?.large ||
    /** @type {any} */ (raw.image)?.medium ||
    '';
  if (!imageUrl) return null;
  const fav = Number(raw.favourites) || 0;
  const rarity = rarityFromFavourites(fav);
  const baseValue = baseValueFromStats(fav * 2 + 100, rarity);
  return {
    anilistId: Number(raw.id),
    name: String(name).slice(0, 200),
    series: String(series).slice(0, 200),
    rarity,
    baseValue,
    imageUrl,
    favourites: fav,
    description: String(raw.description ?? '')
      .replace(/<[^>]+>/g, '')
      .slice(0, 400),
  };
}

/**
 * @param {number} id AniList character id
 */
export async function fetchCharacterById(id) {
  const data = await gql(
    `query ($id: Int) { Character(id: $id) { ${CHARACTER_FIELDS} } }`,
    { id: Math.floor(id) }
  );
  return normalizeCharacter(data.Character);
}

/**
 * Intenta varios IDs aleatorios hasta obtener un personaje con imagen (tiempo real).
 * @param {{ maxAttempts?: number, maxId?: number }} [opts]
 */
export async function fetchRandomCharacter(opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 18;
  const maxId = opts.maxId ?? 135_000;
  for (let i = 0; i < maxAttempts; i++) {
    const id = 1 + Math.floor(Math.random() * maxId);
    try {
      const c = await fetchCharacterById(id);
      if (c) return c;
    } catch {
      /* siguiente intento */
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error(
    'AniList no devolvió un personaje válido a tiempo. Vuelve a intentar en unos segundos.'
  );
}

/**
 * Busca personajes por nombre (para charinfo / roll temático futuro).
 * @param {string} search
 * @param {number} [page]
 * @param {number} [perPage]
 */
export async function searchCharacters(search, page = 1, perPage = 8) {
  const data = await gql(
    `query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        characters(search: $search) {
          ${CHARACTER_FIELDS}
        }
      }
    }`,
    { search: String(search).trim(), page, perPage }
  );
  const list = /** @type {any[]} */ (data.Page?.characters ?? []);
  return list.map((c) => normalizeCharacter(c)).filter(Boolean);
}

/**
 * Sincroniza un personaje de AniList a la tabla gacha_characters y devuelve el id local.
 * @param {(sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>} queryFn
 * @param {NonNullable<ReturnType<typeof normalizeCharacter>>} a
 */
export async function upsertGachaCharacterFromAnilist(queryFn, a) {
  const existing = await queryFn(
    `SELECT id FROM gacha_characters WHERE anilist_id = ? LIMIT 1`,
    [a.anilistId]
  );
  if (existing[0]) {
    await queryFn(
      `UPDATE gacha_characters SET name = ?, series = ?, rarity = ?, base_value = ?, preview_url = ?, fav_count = ?
       WHERE anilist_id = ?`,
      [a.name, a.series, a.rarity, a.baseValue, a.imageUrl, a.favourites, a.anilistId]
    );
    return Number(existing[0].id);
  }
  try {
    const ins = await queryFn(
      `INSERT INTO gacha_characters (name, series, rarity, base_value, preview_url, anilist_id, fav_count)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        a.name,
        a.series,
        a.rarity,
        a.baseValue,
        a.imageUrl,
        a.anilistId,
        a.favourites,
      ]
    );
    return Number(ins[0].id);
  } catch (e) {
    if (/** @type {any} */ (e).code !== '23505') throw e;
    const dup = await queryFn(
      `SELECT id FROM gacha_characters WHERE name = ? AND series = ? LIMIT 1`,
      [a.name, a.series]
    );
    if (!dup[0]) throw e;
    await queryFn(
      `UPDATE gacha_characters SET rarity = ?, base_value = ?, preview_url = ?, anilist_id = ?, fav_count = ?
       WHERE id = ?`,
      [a.rarity, a.baseValue, a.imageUrl, a.anilistId, a.favourites, dup[0].id]
    );
    return Number(dup[0].id);
  }
}
