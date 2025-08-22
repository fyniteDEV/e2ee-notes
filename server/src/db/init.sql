CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    -- wrapped master key and metadata
    master_wrapped_pass TEXT NOT NULL,
    kdf_name TEXT NOT NULL DEFAULT 'PBKDF2',
    kdf_hash TEXT NOT NULL DEFAULT 'SHA-256',
    kdf_iterations INT NOT NULL,
    kek_salt TEXT NOT NULL,
    wrap_algorithm TEXT NOT NULL DEFAULT 'AES-GCM',
    wrap_iv TEXT, -- may not be needed depending on algorithm

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_iv TEXT NOT NULL,
    content TEXT,
    content_iv TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
