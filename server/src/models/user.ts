import { pool } from "../db/db";

export const createUser = async (
    email: string,
    username: string,
    passwordHash: string,
    wrappedMasterKey: string,
    kdfName: string,
    kdfHash: string,
    kdfIterations: number,
    wrapAlgorithm: string,
    kekSalt: string,
    wrapIV: string
) => {
    const query = `
        INSERT INTO users (
            email, username, password_hash, master_wrapped_pass,
            kdf_name, kdf_hash, kdf_iterations, kek_salt,
            wrap_algorithm, wrap_iv)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `;
    const values = [
        email,
        username,
        passwordHash,
        wrappedMasterKey,
        kdfName,
        kdfHash,
        kdfIterations,
        kekSalt,
        wrapAlgorithm,
        wrapIV,
    ];

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
