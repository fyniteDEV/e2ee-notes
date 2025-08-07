import { pool } from "../db/db";

export const addRefreshToken = async (
    userId: string,
    tokenHash: string,
    expiresAtISO: string
) => {
    const query = `
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3);
    `;
    const values = [userId, tokenHash, expiresAtISO];

    try {
        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (err) {
        console.error(
            "An error occurred while executing the database query: " + err
        );
        throw err;
    }
};

export const revokeAllRefreshTokensByUser = async (userId: string) => {
    const query = `
        UPDATE refresh_tokens
        SET revoked = TRUE
        WHERE user_id = $1;
    `;
    const values = [userId];

    try {
        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (err) {
        console.error(
            "An error occurred while executing the database query: " + err
        );
        throw err;
    }
};

export const revokeRefreshToken = async (tokenHash: string) => {
    const query = `
        UPDATE refresh_tokens
        SET revoked = TRUE
        WHERE token = $1;
    `;
    const values = [tokenHash];

    try {
        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (err) {
        console.error(
            "An error occurred while executing the database query: " + err
        );
        throw err;
    }
};

export const getEntryByTokenHash = async (tokenHash: string) => {
    const query = `
        SELECT user_id, token, expires_at, revoked, created_at
        FROM refresh_tokens
        WHERE token = $1
    `;
    const values = [tokenHash];

    try {
        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (err) {
        console.error(
            "An error occurred while executing the database query: " + err
        );
        throw err;
    }
};
