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
        INSERT INTO notes (user_id, title, content)
        VALUES ($1, $2, $3)
        RETURNING id, title, content, created_at
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

export const deleteNote = async (id: number, userId: string) => {
    const query = `
         DELETE FROM notes
         WHERE id = $1 AND user_id = $2; 
    `;
    const values = [id, userId];

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

export const updateNote = async (
    title: string,
    content: string,
    noteId: number,
    userId: string
) => {
    const query = `
        UPDATE notes
        SET title = $1, content = $2
        WHERE id = $3 AND user_id = $4;
    `;
    const values = [title, content, noteId, userId];

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
