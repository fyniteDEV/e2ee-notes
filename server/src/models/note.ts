import { pool } from "../db/db";

export const getNotesByUserId = async (id: string) => {
    const query = `
        SELECT id, title, content, created_at
        FROM notes
        WHERE user_id = $1
    `;
    const values = [id];

    try {
        const res = await pool.query(query, values);
        return res.rows;
    } catch (err) {
        console.error(
            "An error occurred while executing the database query: " + err
        );
        throw err;
    }
};

export const createNote = async (
    userId: string,
    title: string,
    content: string
) => {
    const query = `
        INSERT INTO notes (user_id, title, content, created_at)
        VALUES ($1, $2, $3)
    `;
    const values = [userId, title, content];

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
