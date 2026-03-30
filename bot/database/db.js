import pg from 'pg';
import dotenv from 'dotenv';
import { runMigrations as runPanelMigrations } from './migrations.js';

dotenv.config();

const { Pool } = pg;

/**
 * @param {string} sql
 * @param {unknown[]} params
 */
function toPg(sql, params) {
  let n = 0;
  const text = sql.replace(/\?/g, () => `$${++n}`);
  if (n !== params.length) {
    throw new Error(`SQL placeholders (${n}) no coinciden con params (${params.length})`);
  }
  return { text, values: params };
}

/**
 * @returns {string | undefined}
 */
function connectionString() {
  const url = process.env.DATABASE_URL?.trim();
  return url || undefined;
}

function createPool() {
  const url = connectionString();
  if (url) {
    return new Pool({
      connectionString: url,
      max: 15,
      idleTimeoutMillis: 30_000,
      ssl: sslOptionForUrl(url),
    });
  }

  const host = process.env.DB_HOST ?? '127.0.0.1';
  const port = Number(process.env.DB_PORT ?? 5432);
  const user = process.env.DB_USER ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_NAME ?? 'postgres';

  const needSsl =
    process.env.DB_SSL === '1' ||
    process.env.DB_SSL === 'true' ||
    /supabase\.co/i.test(host);

  console.warn('[db] DATABASE_URL no definida; usando DB_HOST/DB_USER (modo local).');

  return new Pool({
    host,
    port,
    user,
    password,
    database,
    max: 15,
    idleTimeoutMillis: 30_000,
    ssl: needSsl ? { rejectUnauthorized: false } : undefined,
  });
}

/**
 * @param {string} url
 */
function sslOptionForUrl(url) {
  try {
    const u = new URL(url);
    if (u.searchParams.get('sslmode') === 'disable') return undefined;
  } catch {
    /* ignore */
  }
  return { rejectUnauthorized: false };
}

const pool = createPool();

pool.on('error', (err) => {
  console.error('[db] Error inesperado en el pool:', err.message);
});

/**
 * @param {string} sql
 * @param {unknown[]} [params]
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function query(sql, params = []) {
  let text;
  let values;
  if (sql.includes('?')) {
    const p = toPg(sql, params);
    text = p.text;
    values = p.values;
  } else {
    text = sql;
    values = params;
  }
  const result = await pool.query(text, values);
  return result.rows;
}

/**
 * @param {string} sql
 * @param {unknown[]} [params]
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/**
 * @param {(client: pg.PoolClient) => Promise<unknown>} callback
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await callback(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Migraciones del panel (ENUMs + tablas nuevas). Idempotente. */
export async function runSchemaMigrations() {
  await runPanelMigrations(pool);
}

let ensured = false;

export async function ensureTables() {
  if (ensured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS group_settings (
      jid VARCHAR(255) NOT NULL PRIMARY KEY,
      welcome_message TEXT NULL,
      goodbye_message TEXT NULL,
      welcome_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      goodbye_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      nsfw_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      banner_url VARCHAR(1024) NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS economy_enabled BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  await query(`
    ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS gacha_enabled BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  for (const col of [
    `ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN NOT NULL DEFAULT TRUE`,
    `ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS antilink_enabled BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS admin_alerts_enabled BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS only_admin_commands BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS warn_limit INT NOT NULL DEFAULT 3`,
    `ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS economy_currency VARCHAR(32) NOT NULL DEFAULT 'coins'`,
    `ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS primary_bot_jid VARCHAR(255)`,
    `ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS invite_link_cache TEXT`,
  ]) {
    await query(col + ';');
  }

  await query(`
    CREATE TABLE IF NOT EXISTS economy_members (
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      wallet BIGINT NOT NULL DEFAULT 0,
      bank BIGINT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      exp BIGINT NOT NULL DEFAULT 0,
      stat_crime INT NOT NULL DEFAULT 0,
      stat_work INT NOT NULL DEFAULT 0,
      stat_steal INT NOT NULL DEFAULT 0,
      stat_slut INT NOT NULL DEFAULT 0,
      stat_coinflip INT NOT NULL DEFAULT 0,
      stat_roulette INT NOT NULL DEFAULT 0,
      PRIMARY KEY (group_jid, user_jid),
      CONSTRAINT economy_wallet_nonneg CHECK (wallet >= 0),
      CONSTRAINT economy_bank_nonneg CHECK (bank >= 0)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS economy_cooldowns (
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      kind VARCHAR(48) NOT NULL,
      until_ts TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (group_jid, user_jid, kind)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sticker_user_meta (
      user_jid VARCHAR(255) NOT NULL PRIMARY KEY,
      pack_wa VARCHAR(128) DEFAULT 'KirbyBot',
      author_wa VARCHAR(128) DEFAULT 'Bot'
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sticker_packs (
      id SERIAL PRIMARY KEY,
      owner_jid VARCHAR(255) NOT NULL,
      name VARCHAR(120) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      is_private BOOLEAN NOT NULL DEFAULT FALSE,
      is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (owner_jid, name)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sticker_items (
      id SERIAL PRIMARY KEY,
      pack_id INT NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
      file_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_characters (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      series VARCHAR(200) NOT NULL,
      rarity VARCHAR(24) NOT NULL DEFAULT 'comun',
      base_value INT NOT NULL DEFAULT 100,
      preview_url TEXT NOT NULL DEFAULT '',
      extra_images JSONB NOT NULL DEFAULT '[]',
      extra_videos JSONB NOT NULL DEFAULT '[]',
      vote_bonus INT NOT NULL DEFAULT 0,
      fav_count INT NOT NULL DEFAULT 0,
      UNIQUE (name, series)
    );
  `);
  await query(`ALTER TABLE gacha_characters ADD COLUMN IF NOT EXISTS anilist_id INT;`);
  await query(
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_gacha_characters_anilist_id ON gacha_characters (anilist_id) WHERE anilist_id IS NOT NULL;`
  );

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_claims (
      group_jid VARCHAR(255) NOT NULL,
      character_id INT NOT NULL REFERENCES gacha_characters(id) ON DELETE CASCADE,
      owner_jid VARCHAR(255) NOT NULL,
      claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (group_jid, character_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_user_meta (
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      claim_message TEXT,
      PRIMARY KEY (group_jid, user_jid)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_market (
      id SERIAL PRIMARY KEY,
      group_jid VARCHAR(255) NOT NULL,
      seller_jid VARCHAR(255) NOT NULL,
      character_id INT NOT NULL REFERENCES gacha_characters(id) ON DELETE CASCADE,
      price BIGINT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS gacha_market_one_listing
    ON gacha_market (group_jid, character_id) WHERE active = TRUE;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_votes (
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      character_id INT NOT NULL REFERENCES gacha_characters(id) ON DELETE CASCADE,
      voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (group_jid, user_jid, character_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_vote_cooldown (
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      until_ts TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (group_jid, user_jid)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_trades (
      id SERIAL PRIMARY KEY,
      group_jid VARCHAR(255) NOT NULL,
      proposer_jid VARCHAR(255) NOT NULL,
      target_jid VARCHAR(255) NOT NULL,
      offer_character_id INT NOT NULL REFERENCES gacha_characters(id) ON DELETE CASCADE,
      want_character_id INT NOT NULL REFERENCES gacha_characters(id) ON DELETE CASCADE,
      status VARCHAR(24) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_pending_confirm (
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      action VARCHAR(64) NOT NULL,
      payload JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (group_jid, user_jid, action)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_profiles (
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      xp BIGINT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      description TEXT,
      gender VARCHAR(24),
      birth_date DATE,
      partner_jid VARCHAR(255),
      fav_char_name VARCHAR(200),
      total_messages BIGINT NOT NULL DEFAULT 0,
      total_commands INT NOT NULL DEFAULT 0,
      PRIMARY KEY (group_jid, user_jid)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS marriage_proposals (
      id SERIAL PRIMARY KEY,
      group_jid VARCHAR(255) NOT NULL,
      proposer_jid VARCHAR(255) NOT NULL,
      target_jid VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (group_jid, proposer_jid, target_jid)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_warns (
      id SERIAL PRIMARY KEY,
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      reason TEXT NOT NULL,
      by_jid VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_message_stats (
      group_jid VARCHAR(255) NOT NULL,
      user_jid VARCHAR(255) NOT NULL,
      stat_date DATE NOT NULL,
      msg_count INT NOT NULL DEFAULT 0,
      PRIMARY KEY (group_jid, user_jid, stat_date)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS bot_instances (
      instance_id VARCHAR(64) NOT NULL PRIMARY KEY,
      owner_jid VARCHAR(255) NOT NULL,
      short_name VARCHAR(128),
      long_name VARCHAR(256),
      currency_name VARCHAR(48) NOT NULL DEFAULT 'coins',
      menu_banner_url TEXT,
      autojoin_dm BOOLEAN NOT NULL DEFAULT FALSE,
      premium BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS subbot_pairing_tokens (
      token VARCHAR(64) NOT NULL PRIMARY KEY,
      owner_jid VARCHAR(255) NOT NULL,
      premium BOOLEAN NOT NULL DEFAULT FALSE,
      temporal BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id SERIAL PRIMARY KEY,
      from_jid VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status VARCHAR(24) NOT NULL DEFAULT 'pending'
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS panel_config (
      key VARCHAR(128) NOT NULL PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const cnt = await query('SELECT COUNT(*)::int AS c FROM gacha_characters');
  if ((cnt[0]?.c ?? 0) === 0) {
    const demo = [
      ['Miku', 'Vocaloid', 'epico', 800, 'https://picsum.photos/seed/miku512/512/512'],
      ['Rem', 'Re:Zero', 'legendario', 1200, 'https://picsum.photos/seed/rem512/512/512'],
      ['Tohka', 'Date A Live', 'raro', 500, 'https://picsum.photos/seed/tohka512/512/512'],
      ['Asuka', 'Evangelion', 'raro', 600, 'https://picsum.photos/seed/asuka512/512/512'],
      ['Nezuko', 'Demon Slayer', 'comun', 200, 'https://picsum.photos/seed/nezuko512/512/512'],
    ];
    for (const [name, series, rarity, val, url] of demo) {
      await query(
        `INSERT INTO gacha_characters (name, series, rarity, base_value, preview_url) VALUES (?, ?, ?, ?, ?)`,
        [name, series, rarity, val, url]
      );
    }
  }

  ensured = true;
}

/**
 * @param {string} instanceId
 * @param {string} ownerJid
 * @param {string} shortName
 * @param {string} longName
 * @param {string} [currencyName]
 */
export async function upsertBotInstance(instanceId, ownerJid, shortName, longName, currencyName = 'coins') {
  await query(
    `INSERT INTO bot_instances (instance_id, owner_jid, short_name, long_name, currency_name)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (instance_id) DO UPDATE SET
       short_name = EXCLUDED.short_name,
       long_name = EXCLUDED.long_name,
       updated_at = NOW()`,
    [instanceId, ownerJid || 'unknown@s.whatsapp.net', shortName, longName, currencyName]
  );
}

export { pool };
