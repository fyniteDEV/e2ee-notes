import Router from "express";
import dotenv from "dotenv";
import { authenticateAccessToken } from "../middleware/authMiddleware";
import * as noteModel from "../models/note";
import { ProtectedRequest } from "../types";

const notesRouter = Router();
dotenv.config();

notesRouter.get(
    "/",
    authenticateAccessToken,
    async (req: ProtectedRequest, res) => {
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
    async (req: ProtectedRequest, res) => {
        const title = req.body.title;
        const content = req.body.content;
        const noteId = req.body.noteId;

        if (!title || !content || !noteId) {
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
