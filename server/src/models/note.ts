import { pool } from "../db/db";

export const getNotesByUserId = async (id: string) => {
    const query = `
        SELECT id, title, title_iv, content, content_iv,
            wrapped_note_key, note_key_iv, created_at
        FROM notes
        WHERE user_id = $1
        ORDER BY id ASC;
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
    titleIV: string,
    content: string,
    contentIV: string,
    wrappedNoteKey: string,
    noteKeyIV: string
) => {
    const query = `
        INSERT INTO notes (user_id, title, title_iv, content,
            content_iv, wrapped_note_key, note_key_iv)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id,
            title,
            title_iv AS "titleIV",
            content,
            content_iv AS "contentIV",
            wrapped_note_key AS "wrappedNoteKey",
            note_key_iv AS "noteKeyIV",
            created_at AS "createdAt";
    `;
    const values = [
        userId,
        title,
        titleIV,
        content,
        contentIV,
        wrappedNoteKey,
        noteKeyIV,
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
    titleIV: string,
    content: string,
    contentIV: string,
    noteId: number,
    userId: string
) => {
    const query = `
        UPDATE notes
        SET title = $1, title_iv = $2, content = $3,
            content_iv = $4
        WHERE id = $5 AND user_id = $6;
    `;
    const values = [title, titleIV, content, contentIV, noteId, userId];

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
