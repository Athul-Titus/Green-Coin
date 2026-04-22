-- ═══════════════════════════════════════════════
-- GreenCoin — PostgreSQL Schema
-- ═══════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    user_type       VARCHAR(20) NOT NULL DEFAULT 'individual'
                        CHECK (user_type IN ('individual', 'corporate')),
    full_name       VARCHAR(255),
    phone           VARCHAR(20),
    location        VARCHAR(255),
    city            VARCHAR(100),
    neighborhood_type VARCHAR(50),  -- urban/suburban/rural
    lifestyle_profile JSONB DEFAULT '{}'::jsonb,
    green_score     INTEGER DEFAULT 0 CHECK (green_score BETWEEN 0 AND 100),
    -- Corporate-specific
    company_name    VARCHAR(255),
    company_gstin   VARCHAR(20),
    esg_target_tonnes DECIMAL(12,2) DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Action Types (reference) ──────────────────────
CREATE TABLE IF NOT EXISTS action_types (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,  -- transport/diet/energy/waste
    credits_per_unit DECIMAL(8,2) NOT NULL,
    unit            VARCHAR(30) NOT NULL,  -- km/meal/kWh/kg/one-time
    description     TEXT,
    icon            VARCHAR(50),
    max_daily_claim DECIMAL(10,2)  -- fraud guard: max credits per day
);

INSERT INTO action_types (code, display_name, category, credits_per_unit, unit, description, icon, max_daily_claim) VALUES
('cycling_commute',    'Cycling Commute',        'transport', 4,  'km',       'Commute by bicycle instead of car',          'bike',         60),
('public_transport',   'Public Transport',        'transport', 2,  'km',       'Travel by bus, metro, or train',             'bus',          100),
('plant_based_meal',   'Plant-Based Meal',        'diet',      5,  'meal',     'Choose a plant-based meal over meat',        'leaf',         25),
('solar_energy',       'Solar Energy Usage',      'energy',    10, 'kWh',      'Energy from rooftop solar panels',           'sun',          500),
('composting',         'Home Composting',         'waste',     3,  'kg',       'Compost organic waste instead of landfill',  'recycle',      30),
('ev_charging',        'EV Charging',             'energy',    8,  'kWh',      'Charge electric vehicle (vs fuel car)',       'zap',          200),
('led_switch',         'LED Bulb Switch',         'energy',    20, 'one-time', 'Replace incandescent bulbs with LED',        'lightbulb',    20),
('no_flight',          'Avoided Flight',          'transport', 50, 'flight',   'Take train or call instead of flying',       'plane-off',    50);

-- ── Green Actions ────────────────────────────────
CREATE TABLE IF NOT EXISTS green_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type_code    VARCHAR(50) NOT NULL REFERENCES action_types(code),
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quantity            DECIMAL(10,2) NOT NULL DEFAULT 1,  -- km, meals, kWh, etc.
    proof_data          JSONB DEFAULT '{}'::jsonb,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (verification_status IN ('pending','verified','rejected','manual_review')),
    trust_score         INTEGER DEFAULT NULL CHECK (trust_score BETWEEN 0 AND 100),
    fraud_flags         JSONB DEFAULT '[]'::jsonb,
    credits_earned      DECIMAL(10,2) DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_green_actions_user ON green_actions(user_id);
CREATE INDEX idx_green_actions_timestamp ON green_actions(timestamp);
CREATE INDEX idx_green_actions_status ON green_actions(verification_status);

-- ── Carbon Credits ───────────────────────────────
CREATE TABLE IF NOT EXISTS carbon_credits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_id       UUID NOT NULL REFERENCES green_actions(id),
    amount          DECIMAL(10,2) NOT NULL,
    quality_score   INTEGER NOT NULL DEFAULT 80 CHECK (quality_score BETWEEN 0 AND 100),
    status          VARCHAR(20) NOT NULL DEFAULT 'available'
                        CHECK (status IN ('available','reserved','sold')),
    minted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sold_at         TIMESTAMPTZ
);

CREATE INDEX idx_credits_user ON carbon_credits(user_id);
CREATE INDEX idx_credits_status ON carbon_credits(status);

-- ── Credit Bundles ───────────────────────────────
CREATE TABLE IF NOT EXISTS credit_bundles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    total_credits       DECIMAL(12,2) NOT NULL,
    total_tonnes        DECIMAL(10,4) GENERATED ALWAYS AS (total_credits / 100.0) STORED,
    total_users         INTEGER NOT NULL DEFAULT 0,
    action_types        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- breakdown by type
    region              VARCHAR(100),
    quality_score       INTEGER NOT NULL DEFAULT 80 CHECK (quality_score BETWEEN 0 AND 100),
    price_per_tonne     DECIMAL(10,2) NOT NULL,  -- in INR
    total_price         DECIMAL(12,2) GENERATED ALWAYS AS (total_credits / 100.0 * price_per_tonne) STORED,
    status              VARCHAR(20) NOT NULL DEFAULT 'available'
                            CHECK (status IN ('available','reserved','sold')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Bundle Purchases ─────────────────────────────
CREATE TABLE IF NOT EXISTS bundle_purchases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id           UUID NOT NULL REFERENCES credit_bundles(id),
    corporate_id        UUID NOT NULL REFERENCES users(id),
    credits_purchased   DECIMAL(12,2) NOT NULL,
    tonnes_purchased    DECIMAL(10,4) GENERATED ALWAYS AS (credits_purchased / 100.0) STORED,
    price_paid          DECIMAL(12,2) NOT NULL,
    invoice_number      VARCHAR(50) UNIQUE,
    purchased_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ESG Certificates ────────────────────────────
CREATE TABLE IF NOT EXISTS esg_certificates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id         UUID NOT NULL REFERENCES bundle_purchases(id),
    corporate_id        UUID NOT NULL REFERENCES users(id),
    certificate_number  VARCHAR(50) UNIQUE NOT NULL,
    tonnes_offset       DECIMAL(10,4) NOT NULL,
    action_breakdown    JSONB DEFAULT '{}'::jsonb,
    ghg_scope           VARCHAR(10) DEFAULT 'Scope 3',
    sdgs_addressed      JSONB DEFAULT '[]'::jsonb,
    pdf_path            VARCHAR(500),
    qr_code             TEXT,
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until         DATE GENERATED ALWAYS AS (issued_at::date + INTERVAL '1 year') STORED
);

-- ── Advisor Plans ────────────────────────────────
CREATE TABLE IF NOT EXISTS advisor_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cluster_label   VARCHAR(50),
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    forecast        JSONB DEFAULT '{}'::jsonb,
    peer_stats      JSONB DEFAULT '{}'::jsonb,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User Clusters (ML cache) ──────────────────────
CREATE TABLE IF NOT EXISTS user_clusters (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    cluster_id      INTEGER NOT NULL,
    cluster_label   VARCHAR(50) NOT NULL,
    feature_vector  JSONB DEFAULT '{}'::jsonb,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Update trigger ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
