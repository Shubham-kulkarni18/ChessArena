
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,

    room_code VARCHAR(12) NOT NULL UNIQUE,

    white_player_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    black_player_id BIGINT REFERENCES users(id) ON DELETE SET NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        white_player_id IS NULL
        OR black_player_id IS NULL
        OR white_player_id <> black_player_id
    )
);

CREATE INDEX IF NOT EXISTS idx_games_status
    ON games(status);

CREATE INDEX IF NOT EXISTS idx_games_white_player
    ON games(white_player_id);

CREATE INDEX IF NOT EXISTS idx_games_black_player
    ON games(black_player_id);
