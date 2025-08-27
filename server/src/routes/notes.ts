import Router, { Response } from "express";
import dotenv from "dotenv";
import { authenticateAccessToken } from "../middleware/authMiddleware";
import * as noteModel from "../models/note";
import { NotePayload, ProtectedRequest } from "../types";

const notesRouter = Router();
dotenv.config();

function isNotePayload(payload: any): payload is NotePayload {
    return (
        typeof payload === "object" &&
        payload !== null &&
        typeof payload.title === "string" &&
        typeof payload.titleIV === "string" &&
        typeof payload.content === "string" &&
        typeof payload.contentIV === "string" &&
        typeof payload.noteKey === "object" &&
        payload.noteKey !== null &&
        typeof payload.noteKey.wrappedNoteKey === "string" &&
        typeof payload.noteKey.iv === "string"
    );
}

notesRouter.get(
    "/",
    authenticateAccessToken,
    async (req: ProtectedRequest, res: Response) => {
        const notes = await noteModel.getNotesByUserId(req.userData!.id);
        res.json({
            success: true,
            message: "Notes fetched successfully",
            notes: notes,
        });
    }
);

notesRouter.put(
    "/",
    authenticateAccessToken,
    async (req: ProtectedRequest, res: Response) => {
        const title = req.body.title;
        const content = req.body.content;
        const noteId = req.body.noteId;

        if (!title || content === undefined || noteId === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing parameters",
            });
        }

        try {
            await noteModel.updateNote(
                title,
                content,
                noteId,
                req.userData!.id
            );
            return res.json({
                success: true,
                message: "Note saved successfully",
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    }
);

notesRouter.post(
    "/",
    authenticateAccessToken,
    async (req: ProtectedRequest, res: Response) => {
        const payload = req.body;
        console.log(payload);
        if (isNotePayload(payload)) {
            try {
                const dbRes = await noteModel.createNote(
                    req.userData!.id,
                    payload.title,
                    payload.titleIV,
                    payload.content,
                    payload.contentIV,
                    payload.noteKey.wrappedNoteKey,
                    payload.noteKey.iv
                );
                console.log(dbRes);
                res.json({
                    success: true,
                    message: "New note successfully added",
                    notes: [dbRes],
                });
            } catch (err) {
                res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid request: Missing or invalid parameters",
            });
        }
    }
);

notesRouter.delete(
    "/:noteId",
    authenticateAccessToken,
    async (req: ProtectedRequest, res) => {
        const noteId = parseInt(req.params.noteId);
        try {
            await noteModel.deleteNote(noteId, req.userData!.id);
            res.json({
                success: true,
                message: "Note successfully deleted.",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    }
);

export default notesRouter;
