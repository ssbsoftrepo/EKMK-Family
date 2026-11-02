-- ==============================================================================
-- Migration: Seed Encrypted Admin Password into Database
-- Target: kmk-family PostgreSQL Database
-- Password: kmkfamilyadmin1@3$ (PBKDF2WithHmacSHA256 encrypted)
-- ==============================================================================

-- Run manually via psql:
-- psql -U postgres -d kmk-family -f docs/migrations/seed_admin_password.sql

CREATE TABLE IF NOT EXISTS admin_credentials (
    id VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(100) NOT NULL,
    iterations INT NOT NULL DEFAULT 65536,
    algorithm VARCHAR(50) NOT NULL DEFAULT 'PBKDF2WithHmacSHA256',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin_credentials (id, password_hash, salt, iterations, algorithm, created_at, updated_at)
VALUES (
    'admin',
    '+xLyiIkui+G54oS0wzK0fh80y2kXLPhUktpNVf9EA2c=',
    'a21rX2ZhbWlseV8yMDI2Xw==',
    65536,
    'PBKDF2WithHmacSHA256',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    iterations = EXCLUDED.iterations,
    algorithm = EXCLUDED.algorithm,
    updated_at = CURRENT_TIMESTAMP;

