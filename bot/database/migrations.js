/**
 * Esquema PostgreSQL (Supabase). Idempotente: IF NOT EXISTS / DO $$ EXCEPT.
 * Columnas teléfono ampliadas a VARCHAR(64) para compatibilidad con JID largos en integración WA.
 */

const STATEMENTS = [
  `DO $$ BEGIN
    CREATE TYPE rarity_type AS ENUM ('common', 'rare', 'epic', 'legendary');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    CREATE TYPE bot_type AS ENUM ('main', 'sub', 'premium', 'temporal');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'moderator');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `CREATE TABLE IF NOT EXISTS bots (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(64) UNIQUE NOT NULL,
    name_short VARCHAR(50) NOT NULL,
    name_long VARCHAR(100),
    prefix VARCHAR(5) NOT NULL DEFAULT '/',
    owner_phone VARCHAR(64),
    currency_name VARCHAR(30) NOT NULL DEFAULT 'coins',
    banner_url TEXT,
    status_text TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    group_jid VARCHAR(100) UNIQUE NOT NULL,
    bot_phone VARCHAR(64) REFERENCES bots(phone) ON DELETE SET NULL,
    bot_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    economy_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    gacha_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    nsfw_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    antilink_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    only_admin_commands BOOLEAN NOT NULL DEFAULT FALSE,
    warn_limit INT NOT NULL DEFAULT 3,
    welcome_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    welcome_message TEXT,
    goodbye_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    goodbye_message TEXT,
    primary_bot_phone VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_groups_bot_phone ON groups(bot_phone)`,

  `CREATE TABLE IF NOT EXISTS users (
    phone VARCHAR(64) NOT NULL,
    group_jid VARCHAR(100) NOT NULL REFERENCES groups(group_jid) ON DELETE CASCADE,
    xp BIGINT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 1,
    messages_count BIGINT NOT NULL DEFAULT 0,
    commands_count BIGINT NOT NULL DEFAULT 0,
    gender gender_type,
    description TEXT,
    birthdate DATE,
    partner_phone VARCHAR(64),
    favourite_char VARCHAR(100),
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (phone, group_jid)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_group_jid ON users(group_jid)`,
  `CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`,

  `CREATE TABLE IF NOT EXISTS economy (
    phone VARCHAR(64) NOT NULL,
    group_jid VARCHAR(100) NOT NULL,
    wallet BIGINT NOT NULL DEFAULT 0,
    bank BIGINT NOT NULL DEFAULT 0,
    total_earned BIGINT NOT NULL DEFAULT 0,
    total_spent BIGINT NOT NULL DEFAULT 0,
    last_daily TIMESTAMPTZ,
    last_work TIMESTAMPTZ,
    last_crime TIMESTAMPTZ,
    last_slut TIMESTAMPTZ,
    last_steal TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (phone, group_jid),
    FOREIGN KEY (phone, group_jid) REFERENCES users(phone, group_jid) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    serie VARCHAR(150) NOT NULL,
    rarity rarity_type NOT NULL DEFAULT 'common',
    base_value INT NOT NULL DEFAULT 100,
    votes INT NOT NULL DEFAULT 0,
    image_urls JSONB NOT NULL DEFAULT '[]',
    video_urls JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_characters_serie ON characters(serie)`,
  `CREATE INDEX IF NOT EXISTS idx_characters_rarity ON characters(rarity)`,

  `CREATE TABLE IF NOT EXISTS harem (
    id SERIAL PRIMARY KEY,
    owner_phone VARCHAR(64) NOT NULL,
    group_jid VARCHAR(100) NOT NULL,
    char_id INT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    current_value INT NOT NULL,
    on_sale BOOLEAN NOT NULL DEFAULT FALSE,
    sale_price INT,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (char_id, group_jid)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_harem_owner_group ON harem(owner_phone, group_jid)`,
  `CREATE INDEX IF NOT EXISTS idx_harem_group_sale ON harem(group_jid, on_sale)`,

  `CREATE TABLE IF NOT EXISTS warns (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(64) NOT NULL,
    group_jid VARCHAR(100) NOT NULL,
    reason TEXT,
    warned_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_warns_phone_group ON warns(phone, group_jid)`,

  `CREATE TABLE IF NOT EXISTS web_sticker_packs (
    id SERIAL PRIMARY KEY,
    owner_phone VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    is_favourite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_phone, name)
  )`,

  `CREATE TABLE IF NOT EXISTS web_stickers (
    id SERIAL PRIMARY KEY,
    pack_id INT NOT NULL REFERENCES web_sticker_packs(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_web_stickers_pack ON web_stickers(pack_id)`,

  `CREATE TABLE IF NOT EXISTS cooldowns (
    phone VARCHAR(64) NOT NULL,
    group_jid VARCHAR(100) NOT NULL,
    command_name VARCHAR(50) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (phone, group_jid, command_name)
  )`,

  `CREATE TABLE IF NOT EXISTS message_log (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(64) NOT NULL,
    group_jid VARCHAR(100) NOT NULL,
    is_command BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_message_log_group_sent ON message_log(group_jid, sent_at)`,
  `CREATE INDEX IF NOT EXISTS idx_message_log_phone_group_sent ON message_log(phone, group_jid, sent_at)`,

  `CREATE TABLE IF NOT EXISTS subbot_sessions (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(64) UNIQUE NOT NULL,
    session_data TEXT,
    type bot_type NOT NULL DEFAULT 'sub',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS web_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'moderator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

/**
 * @param {{ query: (sql: string, params?: unknown[]) => Promise<unknown> }} poolLike
 */
export async function runMigrations(poolLike) {
  for (const sql of STATEMENTS) {
    await poolLike.query(sql);
  }
}
