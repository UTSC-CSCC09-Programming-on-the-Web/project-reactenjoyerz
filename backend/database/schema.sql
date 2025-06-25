-- database/schema.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
  stripe_sub_id       TEXT    UNIQUE NOT NULL,
  status              TEXT    NOT NULL,
  current_period_end  TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id                  SERIAL PRIMARY KEY,
  subscription_id     INTEGER NOT NULL
                        REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id   TEXT    UNIQUE NOT NULL,
  amount_paid         INTEGER NOT NULL,
  currency            TEXT    NOT NULL,
  paid_at             TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);
