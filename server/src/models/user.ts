import { pool } from "../db/db";

export const createUser = async (
    email: string,
    username: string,
    passwordHash: string
) => {
    const query = `
        INSERT INTO users (email, username, password_hash)
        VALUES ($1, $2, $3);
    `;
    const values = [email, username, passwordHash];

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

export const getUserByEmailOrUsername = async (
    email: string,
    username: string
) => {
    const query = `
        SELECT * FROM users
        WHERE email = $1 OR username = $2;
    `;
    const values = [email, username];

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

export const getUserByEmail = async (email: string) => {
    const query = `
        SELECT * FROM users
        WHERE email = $1;
    `;
    const values = [email];

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

export const getUserById = async (id: string) => {
    const query = `
        SELECT * FROM users
        WHERE id = $1;
    `;
    const values = [id];

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
